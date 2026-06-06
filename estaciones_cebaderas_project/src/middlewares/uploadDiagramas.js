import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'public/uploads/diagramas');
  },

  filename(req, file, cb) {
    const uniqueName =
      Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const uploadDiagramas = multer({
  storage,
  fileFilter(req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Solo se permiten PDF'));
    }

    cb(null, true);
  }
});

export default uploadDiagramas;