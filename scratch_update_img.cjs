const fs = require('fs');
let c = fs.readFileSync('src/components/esun/pdfCoverGenerator.ts', 'utf8');

const oldImgSearch = /<div style="width: 100%; height: 320px;[^>]+>[\s\S]*?<img src="\$\{window\.location\.origin\}\/crosssection_gridtied\.jpg"[\s\S]*?<\/div>/;

const newImgReplace = `<div style="width: 100%; height: 320px; margin-top: 40px; margin-bottom: 40px; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #EEEEEE; background-image: url('\${window.location.origin}/portada_industrial.jpg'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
    </div>`;

if (oldImgSearch.test(c)) {
    c = c.replace(oldImgSearch, newImgReplace);
    fs.writeFileSync('src/components/esun/pdfCoverGenerator.ts', c);
    console.log("Image updated perfectly.");
} else {
    console.log("Could not find the old image block.");
    process.exit(1);
}
