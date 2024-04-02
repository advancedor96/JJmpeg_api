const express = require('express');
const fs = require('fs');
const path = require('path')
const WebSocket = require('ws')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'); // 引入 AWS SDK S3 的客戶端和命令
const multer = require('multer'); // 引入 multer 用於處理上傳的檔案
require('dotenv').config(); // 載入環境變數


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


const app = express();
app.use(express.static(path.join(__dirname, 'view_dist')))
app.use(cors());
app.use(express.json());


const s3Client = new S3Client({
  region: S3_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(mp4|jpeg|png)$/)) {
      return cb(new Error('Only mp4, jpg and png formats are allowed!'), false);
    }
    cb(null, true);
  },
});


const uploadToS3 = async ()=>{
  const key = Date.now().toString() + '-output.mp4'; // 生成檔案名稱
  console.log('準備上傳的檔案名稱: ', key);

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream('./output.mp4'), // 原為 req.file.buffer,
      ContentType: 'video/mp4' //req.file.mimetype,
    });
    status = '準備上傳'
    console.log('準備上傳');
    
    await s3Client.send(command); // 發送命令
    
    const imageUrl = `https://${BUCKET_NAME}.s3.${S3_BUCKET_REGION}.amazonaws.com/${key}`;

    console.log('檔案上傳成功！連結:',imageUrl);
    status = '上傳成功, <閒置中> 連結:' + imageUrl;
    
  } catch (error) {
    console.log(error); // 錯誤訊息
  }
}

let status = "<閒置中>";

app.get('/status', (req, res)=>{
  res.status(200).send(status);
})

app.post('/download', async(req, res)=>{
  const m3u8Url = req.body.url;
  const Origin = req.body.Origin;
  const Referer = req.body.Referer;

  status = '呼叫成功，後端下載中...';
  res.status(200).send();

  ffmpeg(m3u8Url)
  .outputOptions([
    '-c copy', // 使用相同的视频和音频编码进行复制
    '-f mp4', // 输出格式为MP4
  ])
  .addOption('-headers', `Origin: ${Origin}\\r\\nReferer: ${Referer}\\r\\n`)
  .save('output.mp4')
  .on('start', (cmd)=>{
    status = '開始下載:' + cmd;
    console.log('開始下載:',cmd);
  })
  .on('end', function() {
    status = '下載完成啦！FFinished. 準備上傳 s3...'
    console.log('下載完成啦！FFinished. 準備上傳 s3...');
    uploadToS3();
  })
  .on('error', function(err) {
    status = '處理發生錯誤QQ: ' + err.message;
    console.log('處理發生錯誤QQ: ' + err.message);
  })
  .on('progress', function(progress) {
    console.log('進度:',progress.timemark);
    status = `進度: ${progress.timemark}`
  })
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'view_dist', 'index.html'));
});
// .addOption('-user_agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36')
// .addOption('-headers', `Origin: ${Origin}\\r\\nReferer: ${Referer}\\r\\n`)

const port = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: 10000 })
wss.on('connection', ws => {
  ws.on('Gets', message => {
    console.log(`收到前端要求ws`)
    ws.send(status)
  })
})

app.listen(port, () => console.log(`Server running on port ${port}`));
