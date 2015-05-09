module.exports = function(grunt) {
  // プラグインの読み込み
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  
  // 設定
  grunt.initConfig({
    shell: {
      build: {
        options: { stdout:true },
        command: function() { 
          return "node bin/build.js";
        }
      }
    },
    watch: {
      files: ['lib/*.js'], //変更監視したいファイルのパスを書いてください
      tasks: ['shell']
    }
  });
}
