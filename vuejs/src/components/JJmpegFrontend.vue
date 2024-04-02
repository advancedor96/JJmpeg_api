<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar title="JJmpeg - 下載 m3u8 串流(配合後端)2"></v-app-bar>
    <v-main>
      <v-text-field label="狀態" class="mt-3" v-model="status"></v-text-field>
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
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'

  
  const apiUrl = ref('https://jjmpeg-api.onrender.com')
  // const apiUrl = ref('http://localhost:3000')
  const m3u8Url = ref('https://assets.afcdn.com/video49/20210722/m3u8/lld/v_645516.m3u8')
  const Origin = ref('')
  const Referer = ref('')
  const status = ref('');
  
  // const doGet = async ()=>{
  //   try {
  //     let res = axios.get('https://jjmpeg-api.onrender.com/get');
  //     console.log('res:',res);
  //     const socket = new WebSocket('wss://jjmpeg-api.onrender.com');
  //     socket.onopen = function(event) {
  //       console.log('ws 連到 server~');
  //     };

  //     socket.onmessage = function(event) {
  //       console.log('收到服务器消息:', event.data);
  //     };
      
      
  //   } catch (err) {
  //     console.log('err:',err);
  //   }
  // }
  onMounted(()=>{
  })

  const getStatus = async ()=>{
    let res = await axios.get('/status');
    status.value = res.data;
  }
  const download = async ()=>{
    try {
      await axios.post('/download', {
        "url": m3u8Url.value,
        "Origin": Origin.value,
        "Referer": Referer.value
      })
      const conn = new WebSocket('wss://localhost');
      conn.onopen = function(e) {
          console.log("ws 建立!");
      };
      conn.onmessage = function(e) {
          console.log(e.data);
      };
      conn.onclose = function(e) {
          console.log(e.code);
          console.log(e.reason);
      };              
      conn.onerror = function(e) {
          console.log(e);
      };  
    } catch (err) {
      console.log('err:',err);
    } finally{
      console.log('finished');
    }
  }

</script>
<style scoped>
  
</style>
  