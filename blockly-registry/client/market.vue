<template>
  <div
    class="blockly-registry-container"
    :style="{ 'pointer-events': isDisabled ? 'none' : 'auto' }"
  >
    <!-- header -->
    <div class="layout-header">
      <span class="left">BLOCKLY REGISTRY</span>
      <span class="blockly-registry-mode-select arktitle" @click="openSw">
        <span v-if="upload_mode">
          <svg
            style="fill: #808080"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M870.4 57.6C780.8 19.2 652.8 0 512 0 371.2 0 243.2 19.2 153.6 57.6 51.2 102.4 0 153.6 0 211.2l0 595.2c0 57.6 51.2 115.2 153.6 153.6C243.2 1004.8 371.2 1024 512 1024c140.8 0 268.8-19.2 358.4-57.6 96-38.4 153.6-96 153.6-153.6L1024 211.2C1024 153.6 972.8 102.4 870.4 57.6L870.4 57.6zM812.8 320C729.6 352 614.4 364.8 512 364.8 403.2 364.8 294.4 352 211.2 320 115.2 294.4 70.4 256 70.4 211.2c0-38.4 51.2-76.8 140.8-108.8C294.4 76.8 403.2 64 512 64c102.4 0 217.6 19.2 300.8 44.8 89.6 32 140.8 70.4 140.8 108.8C953.6 256 908.8 294.4 812.8 320L812.8 320zM819.2 505.6C736 531.2 620.8 550.4 512 550.4c-108.8 0-217.6-19.2-307.2-44.8C115.2 473.6 64 435.2 64 396.8L64 326.4C128 352 172.8 384 243.2 396.8 326.4 416 416 428.8 512 428.8c96 0 185.6-12.8 268.8-32C851.2 384 896 352 960 326.4l0 76.8C960 435.2 908.8 473.6 819.2 505.6L819.2 505.6zM819.2 710.4c-83.2 25.6-198.4 44.8-307.2 44.8-108.8 0-217.6-19.2-307.2-44.8C115.2 684.8 64 646.4 64 601.6L64 505.6c64 32 108.8 57.6 179.2 76.8C326.4 601.6 416 614.4 512 614.4c96 0 185.6-12.8 268.8-32C851.2 563.2 896 537.6 960 505.6l0 96C960 646.4 908.8 684.8 819.2 710.4L819.2 710.4zM512 960c-108.8 0-217.6-19.2-307.2-44.8C115.2 889.6 64 851.2 64 812.8l0-96c64 32 108.8 57.6 179.2 76.8 76.8 19.2 172.8 32 262.4 32 96 0 185.6-12.8 268.8-32 76.8-19.2 121.6-44.8 185.6-76.8l0 96c0 38.4-51.2 76.8-140.8 108.8C736 947.2 614.4 960 512 960L512 960zM512 960"
            ></path>
          </svg>
        </span>
        <span v-if="!upload_mode">
          <svg
            style="fill: #808080"
            viewBox="0 -100 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M352.456912 832.032253c-35.434907 0-63.989249 28.554342-63.989249 63.989249 0 35.434907 28.554342 63.989249 63.989249 63.989249s63.989249-28.554342 63.989249-63.989249C416.446162 860.586595 387.891819 832.032253 352.456912 832.032253L352.456912 832.032253z"
              fill="#575B66"
              p-id="4291"
            ></path>
            <path
              d="M800.55367 832.032253c-35.434907 0-63.989249 28.554342-63.989249 63.989249 0 35.434907 28.554342 63.989249 63.989249 63.989249s63.989249-28.554342 63.989249-63.989249C864.54292 860.586595 835.816563 832.032253 800.55367 832.032253L800.55367 832.032253z"
              fill="#575B66"
              p-id="4292"
            ></path>
            <path
              d="M864.026877 800.037628 344.200235 800.037628c-46.099782 0-86.695112-36.466991-92.199563-83.082815l-54.356459-382.043339L166.853687 156.360826c-1.892155-15.653284-16.169326-28.382328-29.930455-28.382328L95.983874 127.978498c-17.717453 0-31.994625-14.277171-31.994625-31.994625s14.277171-31.994625 31.994625-31.994625l40.767344 0c46.615824 0 87.727196 36.466991 93.403662 83.082815l30.790526 177.86259L315.473879 708.698135c1.720141 14.793214 15.309256 27.350244 28.726356 27.350244l519.826642 0c17.717453 0 31.994625 14.277171 31.994625 31.994625S881.744331 800.037628 864.026877 800.037628z"
              fill="#575B66"
              p-id="4293"
            ></path>
            <path
              d="M384.279523 672.05913c-16.685369 0-30.618512-12.729044-31.82261-29.586427-1.376113-17.545439 11.868974-33.026709 29.586427-34.230808l434.163615-31.994625c15.997312-0.172014 29.414413-12.55703 31.134554-26.834201l50.400134-288.295649c1.204099-10.664875-1.720141-22.533848-8.084663-29.758441-4.128339-4.644381-9.288762-7.052579-15.309256-7.052579L319.946246 224.3064c-17.717453 0-31.994625-14.277171-31.994625-31.994625S302.400806 159.973123 319.946246 159.973123l554.05745 0c24.426004 0 46.959852 10.148833 63.301193 28.554342 18.749538 21.157736 27.178229 50.744163 23.565933 81.706703l-50.400134 288.467663c-5.504452 44.895683-45.927768 81.362674-92.027549 81.362674l-431.755417 31.82261C385.82765 671.887116 384.967579 672.05913 384.279523 672.05913z"
              fill="#575B66"
              p-id="4294"
            ></path>
          </svg>
        </span>
      </span>
      <div class="right">
        <span
          class="menu-item el-tooltip__trigger el-tooltip__trigger"
          aria-describedby="el-id-6973-178"
          style="height: 2rem; width: 1.5rem"
          @click="refresh_market"
          ><svg
            t="1686044330104"
            style="fill: #808080"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="1460"
          >
            <path
              d="M938.336973 255.26894c-16.685369-6.020494-35.090879 2.752226-40.939358 19.437594l-24.770032 69.493701c-29.070385-65.537376-74.998152-123.162103-133.48295-166.337645-185.947253-137.611288-450.848984-100.112212-590.180413 83.942886C81.534688 350.908785 52.980346 460.653788 68.805644 570.742819c15.825298 110.605073 74.48211 208.481102 164.789518 275.394591 75.686209 55.904586 164.273476 83.082815 252.172686 83.082815 128.494541 0 255.26894-57.624727 338.007727-166.853687 36.639006-48.335965 61.581052-102.348396 74.48211-160.833193 3.78431-17.373425-7.224593-34.402822-24.426004-38.187133-17.201411-3.78431-34.402822 7.052579-38.187133 24.426004-10.836889 49.36805-31.994625 95.123803-62.957164 135.891147-118.173694 156.016798-342.996136 187.839409-500.90509 70.869814-76.546279-56.592642-126.086343-139.33143-139.503444-232.907106-13.417101-93.059634 10.664875-185.775239 67.77356-261.11742C318.05409 144.491853 542.704519 112.497228 700.785486 229.466823c57.280699 42.315471 100.112212 100.972283 123.334117 167.197715l-110.261045-43.003528c-16.513355-6.364522-35.090879 1.720141-41.627415 18.233496-6.536536 16.513355 1.720141 35.090879 18.233496 41.627415l162.38132 63.473207c3.78431 1.548127 7.740635 2.236183 11.69696 2.236183 0.516042 0 1.032085-0.172014 1.548127-0.172014 1.204099 0.172014 2.408198 0.688056 3.612296 0.688056 13.245087 0 25.630102-8.256677 30.274483-21.32975l57.796741-161.693264C963.623047 279.694944 955.022342 261.289434 938.336973 255.26894z"
              fill="#575B66"
              p-id="1461"
            ></path>
          </svg>
        </span>
      </div>
    </div>
    <!-- cloud text -->
    <div class="blockly-registry-hint">
      <div class="blockly-registry-hint-box">
        <p class="blockly-registry-hint-text" :text="cloud_text">
          {{ cloud_text }}
        </p>
      </div>
    </div>

    <!-- search -->

    <div class="blockly-registry-search-box">
      <div class="blockly-registry-search">
        <input
          class="blockly-registry-input"
          @keyup.enter="search"
          v-model="input_text"
          placeholder="搜索插件名称或作者"
        />
      </div>
      <div class="blockly-registry-search-action">
        <svg
          data-v-a9e07233=""
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          class="market-icon search"
        >
          <path
            fill="currentColor"
            d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
          ></path>
        </svg>
      </div>
    </div>

    <!-- list -->
    <div style="align-items: center;">
    <div class="blockly-registry-pkg-container">
      <a
        v-for="(pkg, index) in packages"
        :key="index"
        class="blockly-registry-item"
      >
        <div class="blockly-registry-name">
          {{ pkg.name }}
        </div>
        <div class="blockly-registry-version">
          {{ pkg.version }}
        </div>
        <div class="blockly-registry-desc">
          <k-markdown inline class="desc" :source="pkg.desc"></k-markdown>
        </div>
        <div class="blockly-registry-author">
          <el-tooltip
            :content="
              pkg.author?.split(' ')[0] ? pkg.author?.split(' ')[0] : pkg.author
            "
            placement="top"
          >
            <span
              class="blockly-registry-avatar"
              @click.stop.prevent="
                $emit(
                  'query',
                  'email:' + pkg.author?.split(' ')[1]
                    ? pkg.author?.split(' ')[1]
                    : pkg.author
                )
              "
            >
              <img
                :src="
                  getAvatar(
                    (pkg.author?.split(' ')[1]
                      ? pkg.author?.split(' ')[1]
                      : pkg.author
                    ).slice(1, -1)
                  )
                "
              />
            </span>
          </el-tooltip>
        </div>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          v-if="!pkg.isinstalled"
          @click="showDialog(pkg.name)"
        >
          <svg
            t="1685970082203"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11166"
          >
            <path
              d="M921.81 298.35a48.58 48.58 0 0 0-7.46-5.7L688.87 158.8c-7.84-4.71-17.33-5.22-21.09-5.22H348c-3.82 0-13.52 0.53-21.42 5.42L109.83 292.53l-0.19 0.12a48.23 48.23 0 0 0-7.44 5.69 27.16 27.16 0 0 0-17.88 25.48v502.52a27.17 27.17 0 0 0 27.14 27.14h801.07a27.09 27.09 0 0 0 27.14-27V323.82a27.16 27.16 0 0 0-17.86-25.47zM350.3 206.21h315.32L818 296.68H203.45zM887 800.84H137V349.32h750z"
              p-id="11167"
            ></path>
            <path
              d="M671.63 573.94l-38.97-35.39-94.34 103.87V411.99h-52.64v230.43l-94.34-103.87-38.97 35.39L512 749.68l159.63-175.74z"
              p-id="11168"
            ></path>
          </svg>
        </button>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          style="background-color: gold"
          v-if="pkg.isinstalled"
          @click="showDialog(pkg.name)"
        >
          <svg
            t="1685970041674"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11025"
          >
            <path
              d="M855.6032 245.76H844.8v-46.6432c0-45.1584-36.7616-81.92-81.92-81.92H261.12c-45.1584 0-81.92 36.7616-81.92 81.92V245.76h-10.8032c-45.1584 0-81.92 36.7616-81.92 81.92v501.76c0 45.1584 36.7616 81.92 81.92 81.92h687.2064c45.1584 0 81.92-36.7616 81.92-81.92V327.68c0-45.1584-36.7616-81.92-81.92-81.92zM220.16 199.1168c0-22.5792 18.3808-40.96 40.96-40.96h501.76c22.5792 0 40.96 18.3808 40.96 40.96V245.76H220.16v-46.6432zM896.5632 829.44c0 22.5792-18.3808 40.96-40.96 40.96H168.3968c-22.5792 0-40.96-18.3808-40.96-40.96V327.68c0-22.5792 18.3808-40.96 40.96-40.96H855.6032c22.5792 0 40.96 18.3808 40.96 40.96v501.76z"
              fill="#666666"
              p-id="11026"
            ></path>
            <path
              d="M359.1168 850.9952c-14.3872 0-27.2384-8.6016-32.768-21.9648a35.90656 35.90656 0 0 1 7.7312-39.3216l28.672-28.672-29.184-29.184-28.672 28.672a35.84 35.84 0 0 1-39.2704 7.7312 35.87072 35.87072 0 0 1-22.0672-33.4336c0.256-30.4128 12.2368-59.0336 33.7408-80.5376 31.232-31.232 77.1584-41.5232 118.2208-27.6992l160.4096-160.4096c-13.1072-39.4752-4.0448-84.0704 24.4224-114.8928 21.7088-23.4496 52.4288-36.9664 84.2752-37.0688h0.1024c14.3872 0 27.2384 8.6016 32.768 21.9648 5.632 13.568 2.6112 28.9792-7.7312 39.3216l-28.672 28.672 29.184 29.184 28.672-28.672a35.84 35.84 0 0 1 39.2704-7.7312 35.74784 35.74784 0 0 1 22.016 33.4336 114.63168 114.63168 0 0 1-33.7408 80.5376c-31.1808 31.232-77.2096 41.5232-118.2208 27.6992L467.968 699.0336c13.1072 39.4752 4.0448 84.0704-24.4224 114.8928a115.6096 115.6096 0 0 1-84.2752 37.0688h-0.1536z m-25.5488-162.2016c9.216 0 18.3808 3.4816 25.3952 10.496l36.352 36.352c13.9776 13.9776 13.9776 36.7616 0 50.7392l-22.272 22.272c15.4112-2.9696 29.44-10.7008 40.3968-22.5792 20.5312-22.1696 25.344-55.552 12.032-83.0464l-6.3488-13.1072 200.2432-200.2432 13.1584 6.4c28.5184 13.9264 62.72 8.2944 85.1456-14.1312 10.5984-10.5984 17.6128-23.9104 20.4288-38.3488L715.776 465.92c-6.7584 6.7584-15.7696 10.496-25.3952 10.496s-18.5856-3.7376-25.3952-10.496l-36.352-36.352a35.6608 35.6608 0 0 1-10.496-25.3952 35.84 35.84 0 0 1 10.496-25.3952l22.272-22.272c-15.4112 2.9696-29.44 10.7008-40.448 22.5792-20.5312 22.1696-25.344 55.552-12.032 83.0464l6.3488 13.1072-200.2432 200.2432-13.1584-6.4512a74.36288 74.36288 0 0 0-85.1456 14.1312 74.17856 74.17856 0 0 0-20.4288 38.3488l22.272-22.272a36.61824 36.61824 0 0 1 25.4976-10.4448z"
              fill="#666666"
              p-id="11027"
            ></path>
          </svg>
        </button>
      </a>
    </div>
  </div>
    <div class="blockly-registry-pkg-container">
      <div
        v-for="(pkg, index) in show_local_plugins"
        :key="index"
        class="blockly-registry-item"
      >
        <div class="blockly-registry-name">{{ pkg.name }}</div>
        <div class="blockly-registry-name">
          {{ pkg.name }}
        </div>
        <div class="blockly-registry-version">
          {{ pkg.version }}
        </div>
        <div class="blockly-registry-desc">{{ pkg?.desc || "unknow" }}</div>
        <div class="blockly-registry-author">
          <el-tooltip
            :content="
              pkg.author?.split(' ')[0] ? pkg.author?.split(' ')[0] : pkg.author
            "
            placement="top"
          >
            <span
              class="blockly-registry-avatar"
              @click.stop.prevent="
                $emit(
                  'query',
                  'email:' + pkg.author?.split(' ')[1]
                    ? pkg.author?.split(' ')[1]
                    : pkg.author
                )
              "
            >
              <img
                :src="
                  getAvatar(
                    (pkg.author?.split(' ')[1]
                      ? pkg.author?.split(' ')[1]
                      : pkg.author
                    ).slice(1, -1)
                  )
                "
              />
            </span>
          </el-tooltip>
        </div>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn2"
          style="background-color: gold"
          v-if="pkg.isuploaded"
          @click="showDialog(pkg.name)"
        >
          <svg
            t="1685970041674"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="11025"
          >
            <path
              d="M855.6032 245.76H844.8v-46.6432c0-45.1584-36.7616-81.92-81.92-81.92H261.12c-45.1584 0-81.92 36.7616-81.92 81.92V245.76h-10.8032c-45.1584 0-81.92 36.7616-81.92 81.92v501.76c0 45.1584 36.7616 81.92 81.92 81.92h687.2064c45.1584 0 81.92-36.7616 81.92-81.92V327.68c0-45.1584-36.7616-81.92-81.92-81.92zM220.16 199.1168c0-22.5792 18.3808-40.96 40.96-40.96h501.76c22.5792 0 40.96 18.3808 40.96 40.96V245.76H220.16v-46.6432zM896.5632 829.44c0 22.5792-18.3808 40.96-40.96 40.96H168.3968c-22.5792 0-40.96-18.3808-40.96-40.96V327.68c0-22.5792 18.3808-40.96 40.96-40.96H855.6032c22.5792 0 40.96 18.3808 40.96 40.96v501.76z"
              fill="#666666"
              p-id="11026"
            ></path>
            <path
              d="M359.1168 850.9952c-14.3872 0-27.2384-8.6016-32.768-21.9648a35.90656 35.90656 0 0 1 7.7312-39.3216l28.672-28.672-29.184-29.184-28.672 28.672a35.84 35.84 0 0 1-39.2704 7.7312 35.87072 35.87072 0 0 1-22.0672-33.4336c0.256-30.4128 12.2368-59.0336 33.7408-80.5376 31.232-31.232 77.1584-41.5232 118.2208-27.6992l160.4096-160.4096c-13.1072-39.4752-4.0448-84.0704 24.4224-114.8928 21.7088-23.4496 52.4288-36.9664 84.2752-37.0688h0.1024c14.3872 0 27.2384 8.6016 32.768 21.9648 5.632 13.568 2.6112 28.9792-7.7312 39.3216l-28.672 28.672 29.184 29.184 28.672-28.672a35.84 35.84 0 0 1 39.2704-7.7312 35.74784 35.74784 0 0 1 22.016 33.4336 114.63168 114.63168 0 0 1-33.7408 80.5376c-31.1808 31.232-77.2096 41.5232-118.2208 27.6992L467.968 699.0336c13.1072 39.4752 4.0448 84.0704-24.4224 114.8928a115.6096 115.6096 0 0 1-84.2752 37.0688h-0.1536z m-25.5488-162.2016c9.216 0 18.3808 3.4816 25.3952 10.496l36.352 36.352c13.9776 13.9776 13.9776 36.7616 0 50.7392l-22.272 22.272c15.4112-2.9696 29.44-10.7008 40.3968-22.5792 20.5312-22.1696 25.344-55.552 12.032-83.0464l-6.3488-13.1072 200.2432-200.2432 13.1584 6.4c28.5184 13.9264 62.72 8.2944 85.1456-14.1312 10.5984-10.5984 17.6128-23.9104 20.4288-38.3488L715.776 465.92c-6.7584 6.7584-15.7696 10.496-25.3952 10.496s-18.5856-3.7376-25.3952-10.496l-36.352-36.352a35.6608 35.6608 0 0 1-10.496-25.3952 35.84 35.84 0 0 1 10.496-25.3952l22.272-22.272c-15.4112 2.9696-29.44 10.7008-40.448 22.5792-20.5312 22.1696-25.344 55.552-12.032 83.0464l6.3488 13.1072-200.2432 200.2432-13.1584-6.4512a74.36288 74.36288 0 0 0-85.1456 14.1312 74.17856 74.17856 0 0 0-20.4288 38.3488l22.272-22.272a36.61824 36.61824 0 0 1 25.4976-10.4448z"
              fill="#666666"
              p-id="11027"
            ></path>
          </svg>
        </button>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          style="background-color: gold"
          v-if="pkg.isuploaded"
          @click="showDialog_u(pkg.id)"
        >
          <svg
            t="1685983200201"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="3705"
          >
            <path
              d="M821.54 153.57H202.46a27.19 27.19 0 0 0-27.16 27.16v645.59a27.19 27.19 0 0 0 27.16 27.16h619.08a27.19 27.19 0 0 0 27.16-27.16V180.73a27.19 27.19 0 0 0-27.16-27.16zM796 800.81H228V206.25h568z"
              p-id="3706"
            ></path>
            <path
              d="M485.75 391.42V732h52.67V391.47l145.93 160.71 39-35.41-211.26-232.65-211.43 232.64 38.98 35.43 146.11-160.77z"
              p-id="3707"
            ></path>
          </svg>
        </button>
        <button
          :id="`blockly-registry-${pkg.name}`"
          class="blockly-registry-btn"
          v-if="!pkg.isuploaded"
          @click="showDialog_u(pkg.id)"
        >
          <svg
            t="1685983052574"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2396"
          >
            <path
              d="M890.88 141.312l-96.256 755.712c0 8.192-2.048 8.192-10.24 4.096l-210.944-122.88c-10.24-6.144-22.528-2.048-28.672 8.192-6.144 10.24-2.048 22.528 8.192 28.672l210.944 122.88c32.768 18.432 65.536 2.048 71.68-34.816l102.4-798.72c4.096-38.912-26.624-61.44-61.44-43.008l-778.24 411.648c-34.816 18.432-34.816 55.296-2.048 75.776l169.984 102.4c10.24 6.144 22.528 2.048 28.672-6.144 6.144-10.24 2.048-22.528-6.144-28.672l-169.984-102.4c-6.144-4.096-6.144-2.048 0-4.096l739.328-391.168-458.752 589.824v231.424c0 12.288 8.192 20.48 20.48 20.48s20.48-8.192 20.48-20.48v-219.136l450.56-579.584z"
              fill="#32373B"
              p-id="2397"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" class="dialog" :append-to-body="true">
    <div>⭐不错的插件，要安装莫？</div>
    <select v-model="select_plugin_version">
      <option
        v-for="(version, index) in availiable_version"
        :key="index"
        :value="version"
      >
        {{ version }}
      </option>
    </select>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="close_dialogVisible">再想想👌</el-button>
        <el-button @click="install(false)">安装选择的版本(^-^)</el-button>
        <el-button type="primary" @click="install(true)" :loading="upLoading">
          <span>👍安装最新版</span>
        </el-button>
      </span>
    </template>
  </el-dialog>
  <el-dialog v-model="dialogVisible_u" class="dialog" :append-to-body="true">
    <div>⭐不错的插件，要上传莫？</div>
    <input v-model="upload_plugin_desc" placeholder="输入插件描述📖" />
    <br />
    <input v-model="upload_plugin_version" placeholder="输入插件版本✍️" />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible_u = false">再想想🙉</el-button>
        <el-button type="primary" @click="upload" :loading="upLoading">
          <span>👍即刻上传</span>
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { send, message } from "@koishijs/client";
import { ref, watch } from "vue";
import * as md5 from "spark-md5";
export interface Packages {
  name: string;
  version: string;
  desc: string;
  author: string;
  isinstalled: boolean;
}
export interface BlocklyDocument {
  id: number;
  uuid: string;
  name: string;
  body: string;
  code: string;
  enabled?: boolean;
  edited?: boolean;
  author?: string;
  desc?: string;
  version?: string;
  isuploaded?: boolean;
}
const dialogVisible = ref(false);
const upLoading = ref(false);
const isDisabled = ref(false);
const upload_mode = ref(false);
const dialogVisible_u = ref(false);
const select_plugin_u = ref<number>();
const local_plugins = ref<BlocklyDocument[]>();
const cloud_plugins = ref<Packages[]>();
const select_plugin = ref<string>();
const input_text = ref<string>();
const packages = ref<Packages[]>();
const upload_plugin_desc = ref<string>();
const upload_plugin_version = ref<string>();
const select_plugin_version = ref<string>();
const availiable_version = ref<string[]>();
const cloud_text = ref<string>();

const getAvatar = (email: string) => {
  if (!email.includes("@"))
    return `http://q2.qlogo.cn/headimg_dl?dst_uin=${email}&spec=100`;
  return (
    "https://s.gravatar.com" +
    "/avatar/" +
    (email
      ? (md5 as unknown as typeof import("spark-md5")).hash(email.toLowerCase())
      : "") +
    ".png?d=mp"
  );
};
const get_cloud_text = () => {
  send("blockly-registry/cloud-text").then((data) => {
    cloud_text.value = data as string;
  });
};
const refresh_market = () => {
  get_cloud_text();
  send("blockly-registry/query-cloud").then((data) => {
    cloud_plugins.value = data;
    packages.value = data;
    message.success("刷新成功");
  });
};
const get_availiable_version = (name: string) => {
  send("blockly-registry/query-version", name).then((data) => {
    availiable_version.value = data;
  });
};
const showDialog = (name: string) => {
  get_availiable_version(name);
  select_plugin.value = name;
  dialogVisible.value = true;
};

const search = () => {
  if (isDisabled.value) {
    message.warning("操作频繁!!⚠️");
    return;
  }
  isDisabled.value = true;
  if (input_text.value == "") {
    refresh_package(cloud_plugins.value);
  }
  const target_list = [];
  for (var i of cloud_plugins.value) {
    if (
      i.name.includes(input_text.value) ||
      i.author.includes(input_text.value)
    ) {
      target_list.push(i);
    }
  }
  message.success(`找到${target_list.length}个插件`);
  refresh_package(target_list);
};
const refresh_package = (pkgs: Packages[]) => {
  packages.value = pkgs;
  isDisabled.value = false;
  input_text.value = "";
};
const openSw = () => {
  upload_mode.value = !upload_mode.value;
};
const install = (latest: boolean = true) => {
  const target_version: string = latest
    ? availiable_version.value[0]
    : select_plugin_version.value;
  isDisabled.value = true;
  close_dialogVisible();
  send("blockly-registry/install", select_plugin.value, target_version).then(
    (data) => {
      if ((data as string).startsWith("error")) {
        message.error(data as string);
      } else {
        message.success(data as string);
      }
      isDisabled.value = false;
    }
  );
};
const showDialog_u = (id: number) => {
  select_plugin_u.value = id;
  dialogVisible_u.value = true;
};
const show_local_plugins = ref<BlocklyDocument[]>();
const upload = () => {
  isDisabled.value = true;
  close_dialogVisible_u();
  send("blockly-registry/upload", select_plugin_u.value).then((data) => {
    if ((data as string).startsWith("error")) {
      message.error(data as string);
    } else {
      message.success(data as string);
    }
    isDisabled.value = false;
  });
};
const close_dialogVisible = () => {
  dialogVisible.value = false;
};
const close_dialogVisible_u = () => {
  dialogVisible_u.value = false;
  upload_plugin_desc.value = "";
  upload_plugin_version.value = "";
};

// 初始化
get_cloud_text();
send("blockly-registry/query-cloud").then((data) => {
  cloud_plugins.value = data;
  packages.value = data;
});
send("blockly-registry/query").then((data) => {
  local_plugins.value = data;
});
watch(upload_mode, (value) => {
  if (!value) {
    packages.value = cloud_plugins.value;
    show_local_plugins.value = [];
  } else {
    packages.value = [];
    show_local_plugins.value = local_plugins.value;
  }
});
</script>
<style lang="scss" scoped>
.blockly-registry-hint {
  align-items: center;
}
.blockly-registry-hint-box {
  position: relative;
  /* 最外层盒子，需要三个属性：定宽、文字不换行、超过隐藏 */
  width: 40rem;
  white-space: nowrap;
  overflow: hidden;
  margin: 1rem 0 -0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
}
.blockly-registry-hint-text {
  top: 0%;
  /* 盒子背景宽度将随文字宽度而进行自适应 */
  width: fit-content;
  /* 添加动画 */
  animation: move 4s linear infinite;
  /* 让前面的几个文字有一个初始的距离，达到更好的呈现效果 */
  padding-left: 20px;
}
.blockly-registry-hint-text::after {
  position: absolute;
  right: -100%;
  content: attr(text);
}
@keyframes move {
  0% {
    transform: translateX(100%);
  }
}

.blockly-registry-container {
  width: 100%;
  margin: 0;
  padding: 1rem 1.25rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.3s ease;
  padding: 0 var(--card-margin);
  position: relative;
  height: 100%;
  width: 100%;
}
.blockly-registry-title {
  position: relative;
  text-align: center;
  font-size: xx-large;
}
.arktitle {
  font-weight: bold;
  background: linear-gradient(to bottom, rgb(29, 185, 71), rgb(38, 151, 177));
  color: transparent;
  animation: blink 2s linear infinite;
  -webkit-animation: blink 2s linear infinite;
  -moz-animation: blink 2s linear infinite;
  -ms-animation: blink 2s linear infinite;
  -o-animation: blink 2s linear infinite;
  text-align: justify;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-webkit-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-moz-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-ms-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}
@-o-keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.8;
  }
}

.blockly-registry-mode-select {
  padding: .2rem;
  border-radius: .2rem .2rem .2rem .2rem;
  width: 1.5rem;
  position: absolute;
  left: 14rem;
}
.blockly-registry-refresh-market {
  font-size: 1rem;
}
.blockly-registry-search-box {
  display: flex;
  margin: 2rem auto 0;
  width: 100%;
  max-width: 600px;
  border-radius: 1.5rem;
  align-items: center;
}
.blockly-registry-search {
  flex: 1 1 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 6px;
  padding: 0.75rem 1.25rem;
  padding-right: 0;
  padding-left: 20%;
  grid-gap: 1rem;
  display: grid;
  margin: auto;
  align-content: center;
}
.blockly-registry-input {
  border-radius: 1rem 1rem 1rem 1rem;
  flex: 1 1 auto;
  height: 2rem;
  min-width: 8rem;
  font-size: 1em;
  padding: 0;
  box-sizing: border-box;
  color: inherit;
  background-color: transparent;
  border: none;
  outline: none;
}
.blockly-registry-search-action {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2.5rem;
  cursor: pointer;
}
.blockly-registry-input:hover {
  background-color: rgb(180, 171, 23,10);
}
/* 插件列表 */
.blockly-registry-pkg-container {
  display: grid;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--card-margin);
  grid-template-columns: repeat(auto-fill,minmax(300px,1fr));
  margin: var(--card-margin) 0;
  justify-items: center;
}
.blockly-registry-item {
  position: relative;
  left: 20%;
  width: 17rem;
  height: 12rem;
  transition: box-shadow 0.3s ease;
  box-shadow: 0 0 0 2px inset transparent;
  border: 2px solid var(--k-card-border);
  border-radius: 1rem 1rem 1rem 1rem;
  border-color: #808080 ;
  background-color: var(--k-card-bg);
  border-radius: 8px;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
}
.blockly-registry-item:hover{
  border-color: rgb(51, 175, 197) ;
}
.blockly-registry-name {
  position: absolute;
  font-size: 2rem;
  top: 1rem;
  left: 1rem;
}
.blockly-registry-version {
  padding: 0.2rem;
  position: absolute;
  font-size: 1rem;
  top: 1rem;
  right: 1rem;
}
.blockly-registry-author {
  color: rgb(29, 150, 125);
  border-radius: 1rem 1rem 1rem 1rem;
  position: absolute;
  bottom: 1rem;
  left: 1rem;
}
.blockly-registry-desc {
  position: absolute;
  text-align: left;
  top: 5rem;
  right: 1rem;
  left: 1rem;
}
.blockly-registry-btn {
  padding: 0.2rem;
  width: 4rem;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: rgb(10, 171, 23);
  border-radius: 1rem 1rem 1rem 1rem;
}
.blockly-registry-btn:hover {background-color: transparent}
.blockly-registry-btn2 {
  padding: 0.2rem;
  width: 4rem;
  position: absolute;
  bottom: 1rem;
  right: 6rem;
  background-color: rgb(10, 171, 23);
  border-radius: 1rem 1rem 1rem 1rem;
}
.blockly-registry-btn2:hover {background-color: transparent}
.blockly-registry-avatar {
  display: flex;
  gap: 0.25rem;
  img {
    height: 1.5rem;
    width: 1.5rem;
    border-radius: 100%;
    vertical-align: middle;
  }
}
</style>