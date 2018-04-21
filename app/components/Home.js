import React, { Component } from 'react';
import styles from './Home.css';

const fs = require('fs');
const process = require('child_process');

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
  const path = `${__dirname}/../tmp/${name}.png`;
  fs.writeFileSync(path, decoded.data, { encoding: 'base64' });
  return path;
}

function getOutputImage(beforeSrc, afterSrc) {
  const beforePath = getIngredientImage('before', beforeSrc);
  const afterPath = getIngredientImage('after', afterSrc);
  const output = `before_and_after-${Date.now()}`;

  // Generate the before & after image
  process.execSync(`./bin/beforeafterify.sh -b ${beforePath} -a ${afterPath} -o ./saved/${output}`);

  // Remove the temporary images
  process.execSync(`rm ${beforePath}`);
  process.execSync(`rm ${afterPath}`);

  return `${__dirname}/../saved/${output}.gif`;
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

  renderIngredientPreview(name, src, stateKey) {
    let content;
    if (src) {
      content = <img className={styles.image_preview} src={src} alt={name} />;
    } else {
      content = (
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => this.onFileSelect(e, stateKey)}
        />
      );
    }

    return (
      <div className={styles.image_cell}>{content}</div>
    );
  }

  renderFinalPreview() {
    const { beforeAfterPath } = this.state;

    return (
      <div className={styles.image_cell}>
        <a className={styles.image_preview_container} href={beforeAfterPath} download>
          {beforeAfterPath &&
            <img className={styles.image_preview} src={beforeAfterPath} alt="final" />}
        </a>
      </div>
    );
  }

  render() {
    const { beforeSrc, afterSrc } = this.state;

    return (
      <div className={styles.container}>
        <div className={styles.row}>
          {this.renderIngredientPreview('before', beforeSrc, 'beforeSrc')}
          {this.renderIngredientPreview('after', afterSrc, 'afterSrc')}
        </div>
        <div className={styles.row}>
          {this.renderFinalPreview()}
        </div>
      </div>
    );
  }
}
