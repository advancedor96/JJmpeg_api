<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar title="JJmpeg - 下載 m3u8 串流"></v-app-bar>
    <v-main>
      <h1>FFmpeg WASM</h1>
      <v-text-field label="m3u8 URL" class="mt-3" v-model="m3u8Url"></v-text-field>
  
      <v-text-field label="Origin" class="mt-3" v-model="Origin"></v-text-field>
      <v-text-field label="Referer" class="mt-3" v-model="Referer"></v-text-field>
      
      <v-btn @click="download">
        Download it!
      </v-btn>
  
  
    </v-main>
  </v-layout>
  
</template>
<script setup>
import {ref} from "vue";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util'
const m3u8Url = ref('https://surrit.com/5a5ee99f-9e27-491b-a044-5cf4ef3a1e59/playlist.m3u8');
const Origin = ref('https://missav.com')
const Referer = ref('https://missav.com/dm46/mide-051')

const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'


const ffmpeg = new FFmpeg()
ffmpeg.on('log', ({ message }) => {
  console.log(message);
});
ffmpeg.on("start", (msg) => {
  console.log('ssss,,,,progress:',msg);
  
})

const load  = async ()=>{
  console.log('準備load');
  
  await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
  });
  console.log('Loaded!');
};

  load();

const download = async ()=>{

  try {
    console.log('1');
    console.log('my m3u8:',m3u8Url.value);

    const m3u8Content = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
640x360/video.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
842x480/video.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
1280x720/video.m3u8
`
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(m3u8Content);
    
    await ffmpeg.writeFile('input.m3u8', uint8Array);

    // let m3u8_res = await axios.get(m3u8Url.value, {
    //       responseType: 'arraybuffer'
    //     });
    // console.log('用 axios 抓的:',m3u8_res);
    


    console.log('3');

    await ffmpeg.exec(['-i', 'input.m3u8', '-c', 'copy', 'output.mp4', '-movflags', 'frag_keyframe+empty_moov','-bsf:a',  'aac_adtstoasc' ])
    console.log('4');
    // const data = await ffmpeg.readFile('output.mp4');

    // console.log('5');
    
    // const link = document.createElement('a');
    // link.href = URL.createObjectURL(new Blob([data.buffer], {type: 'video/mp4'}));
    // link.download = 'dl_here.mp4';
    // document.body.appendChild(link);
    // link.click();
  } catch (err) {
    console.log('err',err);
    
  }

  
  

  // ffmpeg.FS('writeFile', 'input.m3u8', await fetchFile(m3u8Url.value));
  // await ffmpeg.run('-i', 'input.m3u8', '-c', 'copy', 'output.mp4');

  // const data = ffmpeg.FS('readFile', 'output.mp4');
  // const blob = new Blob([data.buffer], { type: 'video/mp4' });
  // const link = document.createElement('a');
  // link.href = window.URL.createObjectURL(blob);
  // link.download = 'downloaded_video.mp4';
  // document.body.appendChild(link);
  // link.click();


}
</script>
<style scoped>
  
</style>
  