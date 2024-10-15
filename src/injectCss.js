import fs from 'fs';
import path from 'path';
import purgecss from '@fullhuman/postcss-purgecss';
import postcss from 'postcss';


// Đường dẫn tới file CSS và HTML
const cssFilePath = [
  path.resolve(__dirname, '../src/renderer/src/public/css/bulma.min.css'),
  path.resolve(__dirname, '../src/renderer/src/public/css/FA-611-Free.min.css')
]
const htmlFilePath = path.resolve(__dirname, '../out/preload/gamePanel.html');




async function optimizeAndInsertCSS(cssFilePaths, htmlFilePath) {
  try {
    let combinedCSSContent = '';
    for (const cssFilePath of cssFilePaths) {
      combinedCSSContent += fs.readFileSync(cssFilePath, 'utf-8');
    }
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

    // replace path inside Fontawesome to out/renderer/fonts/
    const fontsPath = path.resolve(__dirname, '../out/renderer/fonts')
    combinedCSSContent = combinedCSSContent.replaceAll('(../fonts/', `(file://${fontsPath}/`)

    // Sử dụng PostCSS với plugin PurgeCSS
    const purgeResult = await postcss([
      purgecss({
        content: [htmlFilePath], // Các file cần kiểm tra để lọc CSS không cần thiết
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: {
          standard: ['button', 'field'], // Thay đổi tên class bạn muốn giữ lại
          // deep: [/^prefix-/, /-suffix$/], // Giữ lại các class có prefix hoặc suffix cụ thể
        },
      })
    ]).process(combinedCSSContent, { from: undefined });

    // Lấy CSS đã tối ưu hóa
    const optimizedCSS = purgeResult.css;

    // Chèn CSS đã tối ưu vào trong thẻ <style> của HTML
    const updatedHtmlContent = htmlContent.replace(
      '<div class="AkiTITLEBAR">',
      `<style name="BulmaOptimized">
      ${optimizedCSS}
      </style>
      <div class="AkiTITLEBAR">
      `
    );

    // Ghi kết quả vào file HTML
    fs.writeFileSync(htmlFilePath, updatedHtmlContent, 'utf-8');
    console.log(`CSS đã được tối ưu và chèn thành công vào ${htmlFilePath}`);
  } catch (error) {
    console.error('Đã xảy ra lỗi:', error);
  }
}

export default function InjectCssTo_gamePreloadPanel({ hook }) {
  return {
    name: 'akiInject'
    , buildStart() {
      // console.log('buildStart...');
    }, closeBundle() {
      // console.log('closeBundle');
      optimizeAndInsertCSS(cssFilePath, htmlFilePath);
    },
  }
}