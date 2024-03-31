const express = require('express');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // 引入 AWS SDK S3 的客戶端和命令
const WebSocket = require('ws');
const multer = require('multer'); // 引入 multer 用於處理上傳的檔案
require('dotenv').config(); // 載入環境變數

const port = process.env.PORT || 3000;

const ffmpeg_s = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
ffmpeg.setFfmpegPath(ffmpeg_s);




const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  BUCKET_NAME,
  S3_BUCKET_REGION
} = process.env;

console.log('參數 BUCKET_NAME' ,BUCKET_NAME);
console.log('參數 S3_BUCKET_REGION' ,S3_BUCKET_REGION);

const s3Client = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(), // 使用記憶體儲存，檔案將保存在 RAM 中
  fileFilter: function (req, file, cb) {
    // 驗證檔案類型，只接受 jpg 和 png 格式
    if (!file.originalname.match(/\.(mp4|jpeg|png)$/)) {
      return cb(new Error('Only mp4, jpg and png formats are allowed!'), false);
    }
    cb(null, true);
  },
});


// 還可以做的事：如何避免後端crash
// 同時多個 req 進來會怎樣。
// 顯示進度(web socket)

const app = express();
app.use(cors());
app.use(express.json());
const uploadToS3 = async ()=>{
  const key = Date.now().toString() + '-output.mp4'; // 生成檔案名稱
  console.log('準備上傳的檔案名稱: ', key);

  wsArrays.forEach((ws)=>{
    ws.send('準備上傳的檔案名稱: ', key);
  })

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream('./output.mp4'), // 原為 req.file.buffer,
      ContentType: 'video/mp4' //req.file.mimetype,
    });
    console.log('準備上傳');
    wsArrays.forEach((ws)=>{
      ws.send('準備上傳');
    })
    
    await s3Client.send(command); // 發送命令
    console.log('上傳成功');
    wsArrays.forEach((ws)=>{
      ws.send('上傳成功');
    })
    
    // 創建 S3 的 URL
    const imageUrl = `https://${BUCKET_NAME}.s3.${S3_BUCKET_REGION}.amazonaws.com/${key}`;

    // 回傳成功訊息和圖片 URL
    console.log('檔案上傳成功！連結:',imageUrl);
    // ws.send('檔案上傳成功！連結: ', imageUrl);
    
  } catch (error) {
    console.log(error); // 錯誤訊息
  }
}
const wsArrays = [];
const wss = new WebSocket.Server({ port: port });
  wss.on('connection', function connection(ws) {
    console.log('建立專屬的 websocket');
    wsArrays.push(ws);
  
    // 向客户端主动发送消息
    ws.send('欢迎连接到服务器!');
  
    ws.on('close', () => {
      console.log('WS Close connected')
  })
  });

app.get('/get', async(req, res)=>{
  


  ffmpeg('https://assets.afcdn.com/video49/20210722/m3u8/lld/v_645516.m3u8')
  .outputOptions([
    '-c copy', // 使用相同的视频和音频编码进行复制
    '-f mp4', // 输出格式为MP4
  ])
  .save('output.mp4')
  .on('start', (cmd)=>{
    console.log('開始下載:',cmd);
    res.status(200).send('連結成功，後端下載中');
  })
  .on('end', function() {
    console.log('下載完成啦！FFinished. 準備上傳 s3...');
    uploadToS3();

  })
  .on('error', function(err) {
    console.log('處理發生錯誤QQ: ' + err.message);
    res.status(500).send('處理發生錯誤QQ:' + err.message);
  })
  .on('progress', function(progress) {
    console.log('進度:',progress.timemark);
    wsArrays.forEach((ws)=>{
      ws.send('進度:' + progress.timemark);
    })
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


app.listen(port, () => console.log(`Server running on port ${port}`));
