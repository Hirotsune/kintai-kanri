// 日本語フォントのBase64データを生成するスクリプト
// 使用方法: node scripts/generate-font-base64.js

const fs = require('fs');
const path = require('path');

// Google FontsからNoto Sans JPをダウンロードしてBase64エンコードする
async function generateFontBase64() {
  try {
    console.log('Noto Sans JPフォントをダウンロード中...');
    
    // Google FontsのNoto Sans JPのURL
    const fontUrl = 'https://fonts.gstatic.com/s/notosansjp/v52/o-0IIpQlx3QUlC5A4PNr5TRASf6M7Q.woff2';
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const fontArrayBuffer = await response.arrayBuffer();
    const fontBase64 = Buffer.from(fontArrayBuffer).toString('base64');
    
    // 生成されたBase64データをファイルに保存
    const outputPath = path.join(__dirname, '../src/fonts/NotoSansJP-Regular-base64.js');
    const content = `// Noto Sans JP Regular フォントのBase64エンコードデータ
// このフォントは日本語文字を正しく表示するために使用されます
// 生成日: ${new Date().toISOString()}
// フォントサイズ: ${fontBase64.length} 文字

const NotoSansJPBase64 = \`${fontBase64}\`;

export default NotoSansJPBase64;
`;

    fs.writeFileSync(outputPath, content, 'utf8');
    
    console.log(`✅ フォントのBase64データが正常に生成されました`);
    console.log(`📁 保存先: ${outputPath}`);
    console.log(`📊 データサイズ: ${fontBase64.length} 文字`);
    
  } catch (error) {
    console.error('❌ フォントの生成に失敗しました:', error);
    console.log('\n📝 手動でフォントを設定する方法:');
    console.log('1. https://fonts.google.com/noto/specimen/Noto+Sans+JP からフォントをダウンロード');
    console.log('2. https://www.base64encode.org/ でBase64エンコード');
    console.log('3. frontend/src/fonts/NotoSansJP-Regular-base64.js に貼り付け');
  }
}

// Node.js環境でfetchを使用するためのpolyfill
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

generateFontBase64();
