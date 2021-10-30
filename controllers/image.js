import express from "express";
import { verifyToken as verifyAccessToken } from "../middlewares/auth.js";
import { verifyUserImagePermission } from "../middlewares/image.js";
import User from "../models/user.js";
import Image from "../models/image.js";
import UserImage from "../models/user_image.js";
import multer from "multer";
import Jimp from "jimp";
import { BASE_URL, STATUS_CODE, UPLOAD_DIR } from "../config.js";
import path from "path";
import fs from "fs";
import AnnotationLabel from "../models/annotation_label.js";
import Annotation from "../models/annotation.js";

const router = express.Router();

// BASE_URL is /image
const __dirname = process.cwd();

function buildImageUrls(imageId) {
  return {
    full: new URL("image/full/" + imageId, BASE_URL),
    thumbnail: new URL("image/thumbnail/" + imageId, BASE_URL),
  };
}

function buildImageResponse(image) {
  const urls = buildImageUrls(image._id);
  return {
    id: image._id,
    originalName: image.originalName,
    imageUrl: urls.full,
    thumbnailUrl: urls.thumbnail,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
  };
}

// get image
router.get(
  "/full/:id",
  verifyAccessToken,
  verifyUserImagePermission,
  async (req, res) => {
    const imageId = req.params.id;
    const image = await Image.findById(imageId).select("path mimetype").exec();
    if (!image) {
      return res.status(404).send({ status: STATUS_CODE.IMAGE_NOT_FOUND });
    }
    console.log(image);
    res.contentType(image.mimetype);
    res.sendFile(path.join(__dirname, image.path));
  }
);

// get thumbnail
router.get("/thumbnail/:id", verifyAccessToken, async (req, res) => {
  const imageId = req.params.id;
  const image = await Image.findById(imageId).select("thumbnail").exec();
  if (!image) {
    return res.status(404).send({ status: STATUS_CODE.IMAGE_NOT_FOUND });
  }
  console.log(image);
  res.sendFile(path.join(__dirname, image.thumbnail.path));
});

// get my images
router.get("/list", verifyAccessToken, async (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit);
  console.log("userId = " + userId + ", limit = " + limit);

  let data = null;
  // fetch user images
  try {
    let query = UserImage.find({ user: userId })
      .select("image")
      .sort({ createdAt: "desc" });

    if (limit) {
      query.limit(limit);
    }
    query.populate({
      path: "image",
    });

    data = await query.exec();
    console.log("number of user images = " + data.length);
  } catch (e) {
    console.log(e);
    res.send({ status: STATUS_CODE.DB_FAILURE });
    return;
  }

  // user has no image
  if (!data) {
    console.log("user has no images");
    return res.send({ status: STATUS_CODE.SUCCESS, images: [] });
  }

  const images = [];
  for (const row of data) {
    if (row.image) {
      images.push(buildImageResponse(row.image));
    }
  }

  // req.params.sortBy
  // req.params.order
  return res.send({ status: STATUS_CODE.SUCCESS, images: images });
});

fs.mkdir(path.join(__dirname, UPLOAD_DIR), (err) => {
  if (err) {
    if (err.errno === -17) {
      return console.log("image upload dir already exists");
    }
    return console.log(err);
  }
  console.log("image upload dir created");
});
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

var upload = multer({ storage: storage });
router.post(
  "/upload",
  verifyAccessToken,
  upload.single("file"),
  async (req, res) => {
    const userId = req.userId;

    const supportedTypes = [
      "image/png",
      "image/jpeg",
      "image/bmp",
      "image/tiff",
    ];

    if (!supportedTypes.includes(req.file.mimetype)) {
      return res.send({ status: STATUS_CODE.IMAGE_INVALID_FILETYPE });
    }

    let fn = req.file.path + ".thumbnail.jpg";
    const thumbnail = {
      path: fn,
      size: null,
    };
    try {
      let j = await Jimp.read(req.file.path);
      j.resize(100, Jimp.AUTO) // resize
        .write(fn); // save

      thumbnail.size = [j.bitmap.width, j.bitmap.height];
    } catch (e) {
      console.error(e);
      res.send({ status: STATUS_CODE.GENERIC_FAILURE });
      return;
    }

    const image = new Image({
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      destination: req.file.destination,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      thumbnail: thumbnail,
    });

    try {
      await image.save();
    } catch (e) {
      console.log("error on image save");
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }

    const userImage = new UserImage({
      user: req.userId,
      image: image._id,
    });

    try {
      await userImage.save();
    } catch (e) {
      console.log("error on userImage save");
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }

    console.log(`user id = ${userId}, image id = ${image._id}`);

    const data = buildImageResponse(image);

    res.send({
      status: STATUS_CODE.SUCCESS,
      image: data,
    });
  }
);

router.get(
  "/annotations/:id",
  verifyAccessToken,
  verifyUserImagePermission,
  async (req, res) => {
    const userId = req.userId;
    const imageId = req.params.id;
    const image = await Image.findById(imageId).select("_id").exec();
    if (!image) {
      return res.status(404).send({ status: STATUS_CODE.IMAGE_NOT_FOUND });
    }

    try {
      const annotations = await Annotation.find({
        user: userId,
        image: imageId,
      })
        .select("_id image label type data")
        .exec();

      return res.send({
        status: STATUS_CODE.SUCCESS,
        annotations: annotations,
      });
    } catch (e) {
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }
  }
);

// save annotations.
// it deletes all the previous annotations and insert new ones.
// what a crappy code for now...
router.post(
  "/annotations/:id",
  verifyAccessToken,
  verifyUserImagePermission,
  async (req, res) => {
    const userId = req.userId;
    const imageId = req.params.id;
    const annotations = req.body;

    try {
      await Annotation.deleteMany({
        user: userId,
        image: imageId,
      }).exec();
      const annotationModels = [];
      for (const a of annotations) {
        annotationModels.push({
          user: userId,
          image: imageId,
          // label: a.labelId,
          type: a.type,
          data: a.data,
        });
      }
      const dbres = await Annotation.insertMany(annotationModels);
      if (dbres.length == annotations.length) {
        await Image.updateOne(
          { _id: imageId },
          {
            updatedAt: Date.now(),
          }
        ).exec();
        const i = await Image.findOne({ _id: imageId }).exec();
        return res.send({
          status: STATUS_CODE.SUCCESS,
          image: buildImageResponse(i),
        });
      } else {
        return res.send({
          status: STATUS_CODE.DB_FAILURE,
        });
      }
    } catch (e) {
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }
  }
);

router.get("/annotation_labels", verifyAccessToken, async (req, res) => {
  const userId = req.userId;
  try {
    const labels = await AnnotationLabel.find({ userId: userId })
      .select("_id text")
      .exec();

    return res.send({ status: STATUS_CODE.SUCCESS, labels: labels });
  } catch (e) {
    console.log(e);
    res.send({ status: STATUS_CODE.DB_FAILURE });
    return;
  }
});

router.post(
  "/annotation_labels/create",
  verifyAccessToken,
  async (req, res) => {
    const userId = req.userId;
    const text = req.body.text;
    try {
      const label = new AnnotationLabel({ userId: userId, text: text });
      await label.save();
      return res.send({
        status: STATUS_CODE.SUCCESS,
        label: { _id: label._id, text: label.text },
      });
    } catch (e) {
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }
  }
);
router.delete(
  "/:id",
  verifyAccessToken,
  verifyUserImagePermission,
  async (req, res) => {
    const userId = req.userId;
    const imageId = req.params.id;
    try {
      await UserImage.deleteMany({
        user: userId,
        image: imageId,
      }).exec();
      await Annotation.deleteMany({
        user: userId,
        image: imageId,
      }).exec();

      const dbres = await Image.deleteOne({
        _id: imageId,
      }).exec();

      if (dbres.n > 0) {
        res.send({ status: STATUS_CODE.SUCCESS });
      } else {
        res.send({ status: STATUS_CODE.RECORD_NOT_FOUND });
      }
    } catch (e) {
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }
  }
);
router.post(
  "/annotation_labels/delete",
  verifyAccessToken,
  async (req, res) => {
    const userId = req.userId;
    const labelId = req.body.labelId;
    try {
      const dbres = await AnnotationLabel.deleteOne({
        _id: labelId,
        userId: userId,
      }).exec();
      if (dbres.n > 0) {
        res.send({ status: STATUS_CODE.SUCCESS });
      } else {
        res.send({ status: STATUS_CODE.RECORD_NOT_FOUND });
      }
    } catch (e) {
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }
  }
);
router.post(
  "/annotation_labels/update",
  verifyAccessToken,
  async (req, res) => {
    const userId = req.userId;
    const labelId = req.body.labelId;
    const labelText = req.body.text;
    try {
      console.log(
        "labelId=" + labelId + " userId=" + userId + " text=" + labelText
      );
      const dbres = await AnnotationLabel.updateOne(
        {
          _id: labelId,
          userId: userId,
        },
        {
          text: labelText,
        }
      ).exec();

      if (dbres.n > 0) {
        res.send({ status: STATUS_CODE.SUCCESS });
      } else {
        res.send({ status: STATUS_CODE.RECORD_NOT_FOUND });
      }
    } catch (e) {
      console.log(e);
      res.send({ status: STATUS_CODE.DB_FAILURE });
      return;
    }
  }
);
export default router;
