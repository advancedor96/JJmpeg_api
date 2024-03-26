const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const ffmpeg_s = require('ffmpeg-static');

const ffmpeg = require('ffmpeg');
const ffmpeg_f = require('fluent-ffmpeg');


const app = express();
console.log(ffmpeg)
app.use(express.json());


app.get('/download', async (req, res) => {
  // const m3u8Url = req.body.url;
  const m3u8Url = req.query.url;
  if(!m3u8Url){
    return res.status(400).send('m3u8 的 URL parameter is required.');
  }
  console.log('取得 m3u8連結：',m3u8Url);

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename="downloaded_video.mp4"');

  const ffmpegPath = path.join(__dirname, 'bin', 'ffmpeg'); 


  const ffmpegProcess = spawn(ffmpegPath, [
    '-i', m3u8Url,  // 输入视频URL
    '-c', 'copy',    // 使用相同的视频和音频编码进行复制
    '-f', 'mp4',     // 输出格式为MP4
    '-movflags', 'frag_keyframe+empty_moov', // 使输出格式适合流式传输
    '-bsf:a', 'aac_adtstoasc',
    'pipe:1'         // 输出到stdout
  ]);
  ffmpegProcess.stdout.pipe(res);

  // 处理错误
  ffmpegProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  ffmpegProcess.on('close', (code) => {
    if (code !== 0) {
      console.log(`FFmpeg process exited with code ${code}`);
    }
    res.end();
  });
});

  
  // try {
  //   const outputPath = `JJ_output_${Date.now()}.mp4`;
  //   const stream = ffmpeg(m3u8Url)
  //   .outputOptions(['-c copy'])
  //   .output(outputPath)

  //   console.log('3333');

  //   res.setHeader('Content-Type', 'video/mp4');
  //   res.setHeader('Content-Disposition', `attachment; filename="${outputPath}"`);

  //   stream.on('start', (commandLine) => {
  //     console.log('start!!.....FFmpeg command:', commandLine);
  //   });

  //   stream.on('data', (chunk) => {
  //     console.log('on data ing...');
      
  //     res.write(chunk);
  //   });

  //   stream.on('end', () => {
  //     res.end();
  //   });

  //   stream.on('error', (err) => {
  //     console.log('111, error');
  //     console.error(err);
  //     res.status(500).send('主程式 Error downloading stream');
  //   });
  // } catch (err) {
  //   console.log('222');
  //   console.error(err);
  //   res.status(500).send('主程式 Error downloading stream');
  // }
// });

function downloadStream(url, outputPath) {
  console.log('這裡，ffmpeg',ffmpeg);

  return  
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));