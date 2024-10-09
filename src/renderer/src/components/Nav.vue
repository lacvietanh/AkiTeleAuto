<script setup>
</script>
<template>
  <nav class="mainNav">
    <div class="lnav-top">
      <a class="navbar-item p-2">
        <span><i class="fa-solid fa-burst fa-xl"></i></span>
        <span class="text">Features</span>
      </a>
      <a class="navbar-item p-2">
        <span><i class="fa-solid fa-house fa-xl"></i></span>
        <span class="text">Dashboard</span>
      </a>
    </div>

    <div class="lnav-bot">
      <a class="navbar-item p-2">
        <span><i class="fa-solid fa-info-circle fa-xl"></i></span>
        <span class="text">Info</span>
      </a>
    </div>
  </nav>
</template>
<style>
  .mainNav {
    z-index: 100;
    width: 50px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: fixed;
    left: 0;
    top: 50px;
    bottom: 50px;
    backdrop-filter: blur(3px);
    text-shadow: 0px 0px 5px #000;
    transition: all .5s;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }
  .mainNav:hover {
    width: 150px;
    background: #20212733;
  }
  .mainNav a.navbar-item {
    display: inline-flex;
  }
  .mainNav a.navbar-item:hover {
    color: #fff;
  }
  .mainNav span.text {
    width: 0;
    overflow: hidden;
    transition: width .5s;
  }
  .mainNav:hover span.text {
    width: 100px;

  }
</style>