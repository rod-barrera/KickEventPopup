const puppeteer = require('puppeteer'); // Importa el módulo Puppeteer para controlar el navegador.
const fs = require('fs'); // Importa el módulo del sistema de archivos para manejar archivos.
const { exec } = require('child_process'); // Importa el módulo para ejecutar comandos del sistema.

(async () => {
  // Lanza una instancia del navegador en modo headless (sin interfaz gráfica).
  const browser = await puppeteer.launch({ headless: true });
  // Abre una nueva página en el navegador.
  const page = await browser.newPage();
  // Navega al archivo HTML especificado.
  await page.goto(`file://${__dirname}/Sub and Event Popup.html`);

  // Evalúa el tamaño del contenido en la página HTML.
  const contentSize = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      width: Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth),
      height: Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
    };
  });

  // Ajusta el tamaño de la vista de la página para capturar todo el contenido.
  await page.setViewport({ width: contentSize.width, height: contentSize.height });

  // Define la duración de la animación en milisegundos (9.14 segundos).
  const animationDuration = 9140;
  // Define el número de frames por segundo (30).
  const framesPerSecond = 30;
  // Calcula el total de frames necesarios.
  const totalFrames = Math.ceil((animationDuration / 1000) * framesPerSecond);

  // Captura los frames necesarios.
  for (let i = 0; i < totalFrames; i++) {
    // Captura una captura de pantalla para cada frame.
    await page.screenshot({ path: `frame${String(i).padStart(3, '0')}.png`, omitBackground: true });
    // Espera el siguiente frame de animación.
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }

  // Cierra el navegador.
  await browser.close();

  // Define el nombre del archivo de salida de video.
  const outputVideo = 'outputNEW.mov';
  // Ejecuta el comando FFmpeg para convertir las capturas de pantalla en un video MOV con transparencia.
  exec(`ffmpeg -framerate ${framesPerSecond} -i frame%03d.png -c:v prores_ks -pix_fmt yuva444p10le -vf "scale=${contentSize.width}:-1" -profile:v 4444 -y ${outputVideo}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`); // Imprime cualquier error de ejecución.
      return;
    }
    console.log(`stdout: ${stdout}`); // Imprime la salida estándar de FFmpeg.
    console.error(`stderr: ${stderr}`); // Imprime la salida de error estándar de FFmpeg.

    // Elimina las capturas de pantalla temporales después de crear el video.
    for (let i = 0; i < totalFrames; i++) {
      fs.unlinkSync(`frame${String(i).padStart(3, '0')}.png`); // Elimina cada archivo de captura de pantalla.
    }
  });
})();