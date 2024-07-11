const puppeteer = require('puppeteer');
const fs = require('fs');
const { exec } = require('child_process');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${__dirname}/Sub and Event Popup.html`);

  // Calcular el tamaño del contenido
  const contentSize = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      width: Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth),
      height: Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    };
  });

  // Establecer el lienzo al tamaño del contenido
  await page.setViewport({ width: contentSize.width, height: contentSize.height });

  // Duración de la animación en milisegundos (9.14 segundos)
  const animationDuration = 9140;
  const framesPerSecond = 30;
  const totalFrames = Math.ceil((animationDuration / 1000) * framesPerSecond);

  // Capturar los frames necesarios
  for (let i = 0; i < totalFrames; i++) {
    await page.screenshot({ path: `frame${String(i).padStart(3, '0')}.png`, omitBackground: true });
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }

  await browser.close();

  // Convertir PNGs a video MOV con transparencia usando ProRes
  const outputVideo = 'output.mov';
  exec(`ffmpeg -framerate ${framesPerSecond} -i frame%03d.png -c:v prores_ks -pix_fmt yuva444p10le -vf "scale=${contentSize.width}:-1" -profile:v 4444 -y ${outputVideo}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    // Limpiar los frames PNG
    for (let i = 0; i < totalFrames; i++) {
      fs.unlinkSync(`frame${String(i).padStart(3, '0')}.png`);
    }
  });
})();
