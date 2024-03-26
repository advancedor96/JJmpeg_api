const express = require('express');

const ffmpeg_s = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
// const ffmpeg_f = require('fluent-ffmpeg');


ffmpeg.setFfmpegPath(ffmpeg_s);

// 確認執行權限
// const command = `chmod +x ${ffmpegPath}`;
// exec(command, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`执行出错: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout}`);
//   console.error(`stderr: ${stderr}`);
//   console.log(`${ffmpegPath} 权限已改变，现在是可执行的。`);
// });


const app = express();
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

  // const ffmpegPath = path.join(__dirname, 'bin', 'ffmpeg'); 
  ffmpeg(m3u8Url)
    .outputOptions([
      '-c copy', // 使用相同的视频和音频编码进行复制
      '-f mp4', // 输出格式为MP4
      '-movflags frag_keyframe+empty_moov', // 使输出格式适合流式传输
      '-bsf:a aac_adtstoasc'
    ])
    .on('start', (cmd)=>{
      console.log('開始下載:',cmd);
    })
    .on('end', function() {
      console.log('下載完成啦！FFinished.');
    })
    .on('error', function(err) {
      console.log('處理發生錯誤QQ: ' + err.message);
      res.status(500).send('處理發生錯誤QQ');
    })
    .on('progress', function(progress) {
      console.log('進度:',progress.timemark);
    })
    .pipe(res, { end: true }); // 将输出直接发送到响应对象

});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

  // 原本的
  // const ffmpegProcess = spawn(ffmpegPath, [
  //   '-i', m3u8Url,  // 输入视频URL
  //   '-c', 'copy',    // 使用相同的视频和音频编码进行复制
  //   '-f', 'mp4',     // 输出格式为MP4
  //   '-movflags', 'frag_keyframe+empty_moov', // 使输出格式适合流式传输
  //   '-bsf:a', 'aac_adtstoasc',
  //   'pipe:1'         // 输出到stdout
  // ]);
  // ffmpegProcess.stdout.pipe(res);

  // ffmpegProcess.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  // });
  // ffmpegProcess.on('close', (code) => {
  //   if (code !== 0) {
  //     console.log(`FFmpeg process exited with code ${code}`);
  //   }
  //   res.end();
  // });