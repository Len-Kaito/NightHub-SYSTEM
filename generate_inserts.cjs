const fs = require('fs');
const path = require('path');

const danhMucDir = path.join(__dirname, 'dist', 'DanhMuc');
const sqlFile = path.join(__dirname, 'insert_data_new.sql');

// Hàm chuẩn hóa chuỗi để so sánh (xóa dấu câu, khoảng trắng)
function normalizeString(str) {
    return str.toLowerCase().replace(/[^a-z0-9a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]/g, '');
}

// 1. Quét file trong dist/DanhMuc
const movies = {}; // normalized name -> { genres: Set }

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.jpg') || file.endsWith('.png')) {
            if (file.includes(' _ ngang')) continue; // Bỏ qua ảnh ngang
            
            const movieName = file.substring(0, file.lastIndexOf('.')).trim();
            const normalized = normalizeString(movieName);
            const folderName = path.basename(dir);
            
            if (!movies[normalized]) {
                movies[normalized] = { originalName: movieName, genres: new Set() };
            }
            
            const lowerFolder = folderName.toLowerCase();
            if (lowerFolder !== 'poster' && lowerFolder !== 'tiếp tục xem' && lowerFolder !== 'đề xuất cho bạn') {
                movies[normalized].genres.add(folderName);
            }
        }
    }
}
scanDir(danhMucDir);

// 2. Đọc DB sql file
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

// Regex tìm INSERT INTO PHIM
const phimRegex = /INSERT INTO PHIM .*?VALUES \('([^']+)', N'([^']+)',/g;
const existingMovies = {}; // normalized name -> MaPhim

let match;
while ((match = phimRegex.exec(sqlContent)) !== null) {
    const maPhim = match[1];
    const tenPhim = match[2].trim();
    existingMovies[normalizeString(tenPhim)] = maPhim;
}

// Lấy danh sách DANH_MUC để map TENDM -> MADM
const dmRegex = /INSERT INTO DANH_MUC \(MaDM, TenDM, MoTa\) VALUES \('([^']+)', N'([^']+)',/g;
const danhMucMap = {}; // TenDM -> MaDM
while ((match = dmRegex.exec(sqlContent)) !== null) {
    danhMucMap[match[2].trim()] = match[1];
}

// Tìm các quan hệ hiện có
const pdmRegex = /INSERT INTO PHIM_DANH_MUC \(MaPhim, MaDM\) VALUES \('([^']+)', '([^']+)'\);/g;
const existingRelations = new Set();
while ((match = pdmRegex.exec(sqlContent)) !== null) {
    existingRelations.add(`${match[1]}_${match[2]}`);
}

// 3. So sánh và tạo INSERT (CHỈ tạo quan hệ, KHÔNG tạo phim)
const newRelationInserts = [];

for (const [normalized, data] of Object.entries(movies)) {
    const maPhim = existingMovies[normalized];
    
    if (!maPhim) {
        console.log(`-- [BỎ QUA] Không tìm thấy phim khớp với: ${data.originalName}`);
        continue;
    }
    
    // Check relations
    for (const genre of data.genres) {
        let maDM = danhMucMap[genre];
        // Thử fix lỗi hoa/thường cho Tinh hoa hollywood
        if (!maDM && genre.toLowerCase() === 'tinh hoa hollywood') {
            maDM = danhMucMap['Tinh hoa Hollywood']; // Trong DB chữ H viết hoa
        }
        
        if (maDM) {
            const relationKey = `${maPhim}_${maDM}`;
            if (!existingRelations.has(relationKey)) {
                newRelationInserts.push(`INSERT INTO PHIM_DANH_MUC (MaPhim, MaDM) VALUES ('${maPhim}', '${maDM}');`);
                existingRelations.add(relationKey);
            }
        } else {
            console.log(`-- [CẢNH BÁO] Không tìm thấy mã Danh Mục cho: ${genre}`);
        }
    }
}

fs.writeFileSync('new_inserts.sql', '-- CÁC QUAN HỆ DANH MỤC MỚI\n' + newRelationInserts.join('\n') + '\n');
console.log('Đã xuất file new_inserts.sql với', newRelationInserts.length, 'quan hệ mới (Không sinh phim thừa!).');
