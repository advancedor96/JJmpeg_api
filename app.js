const express = require('express');
const ffmpeg_s = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
ffmpeg.setFfmpegPath(ffmpeg_s);

// 還可以做的事：如何避免後端crash
// 同時多個 req 進來會怎樣。
// 顯示進度(web socket)

const app = express();
app.use(cors());
app.use(express.json());

app.get('/get', async(req, res)=>{
  ffmpeg('https://assets.afcdn.com/video49/20210722/m3u8/lld/v_645516.m3u8')
  .outputOptions([
    '-c copy', // 使用相同的视频和音频编码进行复制
    '-f mp4', // 输出格式为MP4
  ])
  .save('output.mp4')
  .on('start', (cmd)=>{
    console.log('開始下載:',cmd);
  })
  .on('end', function() {
    console.log('下載完成啦！FFinished.');
  })
  .on('error', function(err) {
    console.log('處理發生錯誤QQ: ' + err.message);
  })
  .on('progress', function(progress) {
    console.log('進度:',progress.timemark);
  })
})
app.post('/download', async (req, res) => {
  // const m3u8Url = req.body.url;
  const m3u8Url = req.body.url;
  const Origin = req.body.Origin;
  const Referer = req.body.Referer;

  if(!m3u8Url){
    return res.status(400).send('m3u8 的 URL parameter is required.');
  }
  console.log('取得 m3u8連結：',m3u8Url);
  console.log('取得 Origin：',Origin);
  console.log('取得 Referer：',Referer);

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
    .addOption('-user_agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36')
    .addOption('-headers', `Origin: ${Origin}\\r\\nReferer: ${Referer}\\r\\n`)
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
