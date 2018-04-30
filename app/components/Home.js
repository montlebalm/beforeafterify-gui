import React, { Component } from 'react';
import styles from './Home.css';

const fs = require('fs');
const process = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve('./');
const SAVED_DIR = `${ROOT_DIR}/saved`;
const TEMP_DIR = `${ROOT_DIR}/tmp`;
const BIN_DIR = `${ROOT_DIR}/bin`;

function decodeBase64Image(dataString) {
  const matches = dataString.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches.length !== 3) return new Error('Invalid input string');

  return {
    type: matches[1],
    data: Buffer.from(matches[2], 'base64'),
  };
}

function getIngredientImage(name, base64Image) {
  const decoded = decodeBase64Image(base64Image);
  const imagePath = `${TEMP_DIR}/${name}.png`;
  fs.writeFileSync(imagePath, decoded.data, { encoding: 'base64' });
  return imagePath;
}

function getOutputImage(beforeSrc, afterSrc) {
  const beforePath = getIngredientImage('before', beforeSrc);
  const afterPath = getIngredientImage('after', afterSrc);
  const output = `before_and_after-${Date.now()}`;

  // Generate the before & after image
  process.execSync(`${BIN_DIR}/beforeafterify.sh -b ${beforePath} -a ${afterPath} -o ${SAVED_DIR}/${output}`);

  // Remove the temporary images
  process.execSync(`rm ${beforePath}`);
  process.execSync(`rm ${afterPath}`);

  return `${SAVED_DIR}/${output}.gif`;
}

export default class Home extends Component {
  constructor() {
    super();

    this.onFileUpload = this.onFileUpload.bind(this);

    this.state = {
      beforeSrc: null,
      afterSrc: null,
      beforeAfterPath: null,
    };
  }

  onFileUpload() {
    const { beforeSrc, afterSrc } = this.state;

    if (!beforeSrc || !afterSrc) return;

    this.setState(() => ({
      beforeAfterPath: getOutputImage(beforeSrc, afterSrc),
    }));
  }

  onFileSelect(e, stateKey) {
    const input = e.target;
    const reader = new FileReader();
    reader.onload = (evt) => {
      this.setState(() => ({ [stateKey]: evt.target.result, }), this.onFileUpload);
    };
    reader.readAsDataURL(input.files[0]);
  }

  renderBeforePreview() {
    const { beforeSrc } = this.state;

    let content;
    if (beforeSrc) {
      content = <img className={styles.image_preview} src={beforeSrc} alt="before" />;
    } else {
      content = <span className={styles.file_label} />;
    }

    const text = beforeSrc ? 'Before' : 'Choose before image';

    return (
      <label className={`${styles.image_cell} ${styles['image_cell--before']}`} htmlFor="input-before">
        <span className={styles.file_label}>{text}</span>
        {content}
        <input
          id="input-before"
          className={styles.file_input}
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => this.onFileSelect(e, 'beforeSrc')}
        />
      </label>
    );
  }

  renderAfterPreview() {
    const { afterSrc } = this.state;

    let content;
    if (afterSrc) {
      content = <img className={styles.image_preview} src={afterSrc} alt="after" />;
    } else {
      content = <span className={styles.file_label} />;
    }

    const text = afterSrc ? 'After' : 'Choose after image';

    return (
      <label className={`${styles.image_cell} ${styles['image_cell--after']}`} htmlFor="input-after">
        {content}
        <span className={styles.file_label}>{text}</span>
        <input
          id="input-after"
          className={styles.file_input}
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => this.onFileSelect(e, 'afterSrc')}
        />
      </label>
    );
  }

  renderFinalPreview() {
    const { beforeAfterPath } = this.state;

    let content;
    if (beforeAfterPath) {
      content = (
        <a className={styles.image_preview_container} href={beforeAfterPath} download>
          <img className={styles.image_preview} src={beforeAfterPath} alt="final" />
        </a>
      );
    } else {
      content = (
        <span className={styles.file_label}>Preview</span>
      );
    }

    return <div className={styles.image_cell}>{content}</div>;
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.row}>
          {this.renderBeforePreview()}
          {this.renderAfterPreview()}
        </div>
        <div className={styles.row}>
          {this.renderFinalPreview()}
        </div>
      </div>
    );
  }
}
