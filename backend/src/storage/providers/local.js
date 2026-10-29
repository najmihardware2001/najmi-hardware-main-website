const fs = require('fs');
const path = require('path');
const Base = require('../MediaProvider');

class LocalProvider extends Base {
  constructor() {
    super();
    // Default storage directory: shared uploads or project-local uploads
    this.uploadDir = process.env.LOCAL_MEDIA_DIR || path.resolve(__dirname, '../../../../backend/uploads');
    this.mediaSubdir = path.join(this.uploadDir, 'media');
    if (!fs.existsSync(this.mediaSubdir)) {
      try {
        fs.mkdirSync(this.mediaSubdir, { recursive: true });
      } catch (e) {
        // Fallback to local package directory if backend/uploads is inaccessible
        this.uploadDir = path.resolve(__dirname, '../../uploads');
        this.mediaSubdir = path.join(this.uploadDir, 'media');
        fs.mkdirSync(this.mediaSubdir, { recursive: true });
      }
    }
  }

  async upload(buffer, id) {
    const filename = `${id}.webp`;
    const targetFile = path.join(this.mediaSubdir, filename);
    await fs.promises.writeFile(targetFile, buffer);
    const publicUrl = `/uploads/media/${filename}`;
    return { url: publicUrl, public_id: id };
  }

  async delete(id) {
    const filename = `${id}.webp`;
    const targetFile = path.join(this.mediaSubdir, filename);
    if (fs.existsSync(targetFile)) {
      await fs.promises.unlink(targetFile);
    }
    return { deleted: true };
  }

  transformUrl(url, width = 800) {
    return url;
  }
}

module.exports = LocalProvider;
