CREATE DATABASE QUANLYKHOAHOC;
GO

USE QUANLYKHOAHOC;
GO

CREATE TABLE dbo.GiaoVien (
    MaGiaoVien			NVARCHAR(20)	NOT NULL PRIMARY KEY,  -- TeacherXXX
    HoTen               NVARCHAR(200)   NOT NULL,
    DuongDanAnhDaiDien  NVARCHAR(1000)  NULL,
    Email               NVARCHAR(200)   NOT NULL UNIQUE,
    DienThoai           NVARCHAR(50)    NULL,
    GioiThieu           NVARCHAR(MAX)   NULL,
    NgayTao             DATETIME        NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE dbo.KhoaHoc (
    MaKhoaHoc			NVARCHAR(20)    NOT NULL PRIMARY KEY,  -- CourseXXX
    MonHoc              NVARCHAR(100)   NOT NULL,
    TieuDe              NVARCHAR(300)   NOT NULL,
    DuongDanAnhKhoaHoc  NVARCHAR(1000)  NULL,
    MoTa                NVARCHAR(MAX)   NOT NULL,
	GiaKhoaHoc			DECIMAL(10,2)	NOT NULL,
    ThoiHan				INT				NOT NULL DEFAULT 150,  -- đơn vị: ngày
    MaGiaoVien			NVARCHAR(20)    NOT NULL,            -- FK → GiaoVien
    NgayCapNhat         DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_KhoaHoc_GiaoVien
      FOREIGN KEY(MaGiaoVien) REFERENCES dbo.GiaoVien(MaGiaoVien)
      ON UPDATE CASCADE ON DELETE NO ACTION
);
GO


CREATE TABLE dbo.MucTieuKhoaHoc (
    MaKhoaHoc			NVARCHAR(20)	NOT NULL,
    ThuTu				INT				NOT NULL,                         -- Mục tiêu số 1, 2, 3 trong khóa học
    NoiDung				NVARCHAR(1000)	NOT NULL,
    PRIMARY KEY (MaKhoaHoc, ThuTu),             -- Khóa chính kết hợp
    FOREIGN KEY (MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE dbo.YeuCauKhoaHoc (
    MaKhoaHoc			NVARCHAR(20)	NOT NULL,
    ThuTu				INT				NOT NULL,
    NoiDung				NVARCHAR(1000)	NOT NULL,
    PRIMARY KEY (MaKhoaHoc, ThuTu),
    FOREIGN KEY (MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE dbo.BaiHoc (
    MaBaiHoc			NVARCHAR(30)    NOT NULL PRIMARY KEY,  -- CourseXXX_YY
    MaKhoaHoc			NVARCHAR(20)    NOT NULL,            -- FK → KhoaHoc
    ThuTu               INT             NOT NULL,
    TieuDe              NVARCHAR(200)   NULL,
    LinkVideo           NVARCHAR(1000)  NOT NULL,
    NgayTao             DATETIME        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_BaiHoc_KhoaHoc
      FOREIGN KEY(MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc)
      ON UPDATE CASCADE ON DELETE CASCADE
);
GO

CREATE TABLE dbo.HocSinh (
    MaHocSinh      NVARCHAR(20)   NOT NULL PRIMARY KEY,  -- StudentXXX
    HoTen          NVARCHAR(200)  NOT NULL,
	PassHash       VARCHAR(MAX)	  NOT NULL,
	DuongDanAnhDaiDien  NVARCHAR(1000)  NULL,
    Email          NVARCHAR(200)  NOT NULL UNIQUE,
    DienThoai      NVARCHAR(50)   NULL,
    NgaySinh       DATE           NULL,
    GioiTinh       NVARCHAR(10)   NULL,
    DiaChi         NVARCHAR(500)  NULL,
    NgayDangKy     DATETIME       NOT NULL DEFAULT GETDATE()
);
GO



CREATE TABLE dbo.KhoaHoc_HocSinh (
    MaKhoaHoc     NVARCHAR(20)  NOT NULL,  -- FK
    MaHocSinh     NVARCHAR(20)  NOT NULL,  -- FK
    NgayDangKy    DATETIME      NOT NULL DEFAULT GETDATE(),
    NgayHetHan    DATETIME      NOT NULL,
    PRIMARY KEY (MaKhoaHoc, MaHocSinh),
    CONSTRAINT FK_KhoaHocHocSinh_KhoaHoc
        FOREIGN KEY (MaKhoaHoc) REFERENCES dbo.KhoaHoc(MaKhoaHoc)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_KhoaHocHocSinh_HocSinh
        FOREIGN KEY (MaHocSinh) REFERENCES dbo.HocSinh(MaHocSinh)
        ON UPDATE CASCADE ON DELETE CASCADE
);
GO


CREATE TRIGGER trg_GiaoVien_InsteadOfInsert
ON dbo.GiaoVien
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Tạo bảng tạm lưu các mã đang có
    DECLARE @Used TABLE (ID INT);
    INSERT INTO @Used (ID)
    SELECT CAST(SUBSTRING(MaGiaoVien, 8, LEN(MaGiaoVien) - 7) AS INT)
    FROM dbo.GiaoVien
    WHERE ISNUMERIC(SUBSTRING(MaGiaoVien, 8, LEN(MaGiaoVien) - 7)) = 1;

    DECLARE @MinUnused INT = 1;

    WHILE EXISTS (
        SELECT 1 FROM @Used WHERE ID = @MinUnused
    )
    BEGIN
        SET @MinUnused += 1;
    END

    INSERT INTO dbo.GiaoVien
        (MaGiaoVien, HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu, NgayTao)
    SELECT
        COALESCE(i.MaGiaoVien, 'Teacher' + CAST(@MinUnused AS VARCHAR)),
        i.HoTen, i.DuongDanAnhDaiDien, i.Email, i.DienThoai, i.GioiThieu,
        GETDATE()
    FROM inserted AS i;
END;
GO

ALTER TRIGGER trg_HocSinh_InsteadOfInsert
ON dbo.HocSinh
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @MaxID INT;

    -- Tìm số lớn nhất hiện tại từ MaHocSinh
    SELECT @MaxID = MAX(CAST(SUBSTRING(MaHocSinh, 8, LEN(MaHocSinh) - 7) AS INT))
    FROM dbo.HocSinh
    WHERE ISNUMERIC(SUBSTRING(MaHocSinh, 8, LEN(MaHocSinh) - 7)) = 1;

    SET @MaxID = ISNULL(@MaxID, 0);

    -- Gán số thứ tự tăng dần cho từng dòng inserted
    ;WITH InsertedWithIndex AS (
        SELECT *,
               ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS RowNum
        FROM inserted
    )
    INSERT INTO dbo.HocSinh
        (MaHocSinh, HoTen, PassHash, Email, DienThoai, NgaySinh, GioiTinh, DiaChi, NgayDangKy)

    SELECT
        'Student' + CAST(@MaxID + i.RowNum AS VARCHAR),
        i.HoTen, i.PassHash, i.Email, i.DienThoai, i.NgaySinh, i.GioiTinh, i.DiaChi,
        GETDATE()
    FROM InsertedWithIndex AS i;
END;
GO

-- 6. Trigger INSTEAD OF INSERT cho KhoaHoc
CREATE TRIGGER trg_KhoaHoc_InsteadOfInsert
ON dbo.KhoaHoc
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @baseMax INT = (
      SELECT ISNULL(MAX(CAST(SUBSTRING(MaKhoaHoc,7,3) AS INT)),0)
      FROM dbo.KhoaHoc
    );

    INSERT INTO dbo.KhoaHoc
      (MaKhoaHoc, MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien, NgayCapNhat)
    SELECT
      COALESCE(i.MaKhoaHoc,
        'Course' + RIGHT(CAST(@baseMax + ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS VARCHAR(3)),3)
      ),
      i.MonHoc, i.TieuDe, i.DuongDanAnhKhoaHoc, i.MoTa, i.GiaKhoaHoc, i.ThoiHan, i.MaGiaoVien, GETDATE()
    FROM inserted AS i;

END;
GO

-- 7. Trigger INSTEAD OF INSERT cho BaiHoc
CREATE TRIGGER dbo.trg_BaiHoc_InsteadOfInsert
ON dbo.BaiHoc
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Thêm bài học mới
    INSERT INTO dbo.BaiHoc
        (MaBaiHoc, MaKhoaHoc, ThuTu, TieuDe, LinkVideo, NgayTao)
    SELECT
        COALESCE(i.MaBaiHoc,
            i.MaKhoaHoc + '_' + RIGHT('00' + CAST(i.ThuTu AS VARCHAR(2)), 2)
        ),
        i.MaKhoaHoc, i.ThuTu, i.TieuDe, i.LinkVideo, GETDATE()
    FROM inserted AS i;

END;
GO

/* --------------------- Dưới đây là phần test SQL bài thầy Phát, đừng xóa để lần sau t check thử-----------------------
SELECT *
FROM dbo.GiaoVien
ORDER BY CAST(SUBSTRING(MaGiaoVien, 8, LEN(MaGiaoVien) - 7) AS INT) ASC;

SELECT MaGiaoVien, HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu, NgayTao FROM GiaoVien
delete GiaoVien where MaGiaoVien = 'Teacher7'


ALTER TABLE dbo.GiaoVien
DROP COLUMN NgayCapNhat;

SELECT MaKhoaHoc, MonHoc, TieuDe, DuongDanAnhKhoaHoc, HoTen, SoLuongBaiHoc FROM KhoaHoc AS K, GiaoVien AS G WHERE K.MaGiaoVien = G.MaGiaoVien

INSERT INTO KhoaHoc (MonHoc, Tieude, DuongDanAnhKhoaHoc, MoTa, MaGiaoVien, SoLuongBaiHoc) VALUES('English', 'English01', null, 'English01', 'Teacher1', 10)
delete KhoaHoc where CAST(SUBSTRING(MaKhoaHoc, 7, LEN(MaGiaoVien) - 6) AS INT)>=  6


SELECT ISNULL(MAX(ThuTu), 0) + 1 AS ind FROM BaiHoc WHERE MaKhoaHoc = 'Course1'
select * from BaiHoc where MaKhoaHoc = 'Course11'

INSERT INTO BaiHoc (MaKhoaHoc, ThuTu, TieuDe, LinkVideo) VALUES('Course5',1,N'Bài học 1','https://quanlykhoahocstg.blob.core.windows.net/avatars/1746799050017_f9d78987-e8db-4458-b32d-f0bd0b06874b_2025-04-29%2001%2047%2015.png')

SELECT *
FROM KhoaHoc
WHERE CAST(SUBSTRING(MaKhoaHoc, 7, LEN(MaKhoaHoc) - 6) AS INT) = (
    SELECT MAX(CAST(SUBSTRING(MaKhoaHoc, 7, LEN(MaKhoaHoc) - 6) AS INT))
    FROM KhoaHoc
    WHERE ISNUMERIC(SUBSTRING(MaKhoaHoc, 7, LEN(MaKhoaHoc) - 6)) = 1
);

INSERT INTO BaiHoc (MaKhoaHoc, ThuTu, TieuDe, LinkVideo)
VALUES ('Course1', 1, 'Tiêu đề', 'http://video.com')

SELECT MaKhoaHoc, MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, MaGiaoVien, SoLuongBaiHoc FROM KhoaHoc ORDER BY CAST(SUBSTRING(MaKhoaHoc, 7, LEN(MaGiaoVien) - 6) AS INT) ASC

SELECT MaKhoaHoc, MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, K.MaGiaoVien, HoTen, SoLuongBaiHoc FROM KhoaHoc AS K, GiaoVien AS G WHERE K.MaGiaoVien = G.MaGiaoVien AND MaKhoaHoc ='Course7'

SELECT * FROM KhoaHoc where MaKhoaHoc = 'Course6'
SELECT * FROM BaiHoc where MaKhoaHoc = 'Course6'

SELECT TieuDe, LinkVideo FROM BaiHoc WHERE MaKhoaHoc = 'Course7' ORDER BY ThuTu ASC
delete GiaoVien where MaGiaoVien = 'Teacher5'
delete KhoaHoc where MaKhoaHoc = 'Course8'

select * from GiaoVien
select * from KhoaHoc
select * from BaiHoc
*/

----- INSERT GIAOVIEN
INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Nguyễn Văn A', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/1_manaaf.jpg', 'nguyenvana748@example.com', '0901234567', N'Hơn 10 năm kinh nghiệm trong nghề');

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Trần Thị B', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/2_s0bzbb.jpg', 'tranthib982@example.com', '0912345678', N'Giáo viên nhiệt tình trẻ tuổi');

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Lê Văn C', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/1_manaaf.jpg', 'levanc351@example.com', '0923456789', N'Giáo viên nhiệt tình trẻ tuổi');

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Phạm Thị D', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/2_s0bzbb.jpg', 'phamthid623@example.com', '0934567890', N'Giáo viên nhiệt tình trẻ tuổi');

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Hoàng Văn E', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/1_manaaf.jpg', 'hoangvane107@example.com', '0945678901', NULL);

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Vũ Thị F', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/2_s0bzbb.jpg', 'vuthif462@example.com', '0956789012', NULL);

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Đặng Văn G', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/1_manaaf.jpg', 'dangvang715@example.com', '0967890123', NULL);

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Bùi Thị H', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/2_s0bzbb.jpg', 'buithih289@example.com', '0978901234', NULL);

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Ngô Văn I', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/1_manaaf.jpg', 'ngovani390@example.com', '0989012345', NULL);

INSERT INTO GiaoVien (HoTen, DuongDanAnhDaiDien, Email, DienThoai, GioiThieu)
VALUES (N'Đỗ Thị K', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/2_s0bzbb.jpg', 'dothik178@example.com', '0990123456', NULL);


----- INSERT KHOAHOC
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Toán', N'Toán 10 cơ bản', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Khóa học toán lớp 10 cơ bản dành cho học sinh phổ thông.', 500000, DEFAULT, 'Teacher1');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Hóa học', N'Hóa học 11 nâng cao', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Nâng cao kiến thức hóa học lớp 11 với các chuyên đề nâng cao.', 650000, 140, 'Teacher1');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Vật lý', N'Vật lý 10 - Sách bài tập', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Hướng dẫn giải bài tập Vật lý 10 theo chương trình chuẩn.', 400000, DEFAULT, 'Teacher2');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Ngữ văn', N'Ngữ văn 12 ôn thi THPT', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Tổng hợp kiến thức ngữ văn lớp 12 để ôn thi THPT.', 700000, 140, 'Teacher3');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Địa lý', N'Địa lý 12 luyện đề', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Luyện tập các đề thi thử địa lý lớp 12 theo cấu trúc đề thi mới.', 550000, 140, 'Teacher4');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Sinh học', N'Sinh học 10 cơ bản', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Tìm hiểu cấu trúc tế bào, sinh học phân tử và di truyền học cơ bản.', 500000, DEFAULT, 'Teacher4');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Tin học', N'Tin học 11 lập trình Pascal', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Khóa học lập trình Pascal cơ bản dành cho học sinh lớp 11.', 600000, DEFAULT, 'Teacher5');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Tiếng Anh', N'Tiếng Anh 10 nâng cao', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Trọn bộ kiến thức nâng cao tiếng Anh lớp 10, phát âm và giao tiếp.', 750000, DEFAULT, 'Teacher5');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Giáo dục công dân', N'GDCD 12 trọng tâm', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Tổng hợp kiến thức GDCD 12 trọng tâm thi THPT.', 400000, 140, 'Teacher6');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Toán', N'Toán 11 hình học nâng cao', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Chuyên đề hình học không gian lớp 11 nâng cao.', 600000, DEFAULT, 'Teacher6');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Hóa học', N'Hóa học 12 luyện thi đại học', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Các chuyên đề trọng điểm hóa học 12, luyện thi THPT quốc gia.', 700000, DEFAULT, 'Teacher7');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Vật lý', N'Vật lý 12 lý thuyết trọng tâm', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Các phần lý thuyết quan trọng Vật lý lớp 12, ôn luyện thi.', 500000, 140, 'Teacher7');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Tiếng Anh', N'Tiếng Anh 12 luyện đề', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Khóa luyện đề tiếng Anh 12 chuẩn cấu trúc đề thi quốc gia.', 800000, DEFAULT, 'Teacher8');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Sinh học', N'Sinh học 12 di truyền nâng cao', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Chuyên đề di truyền và biến dị dành cho học sinh khá giỏi.', 600000, DEFAULT, 'Teacher8');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Ngữ văn', N'Ngữ văn 10 cảm thụ văn học', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Phân tích, cảm nhận tác phẩm văn học lớp 10 theo hướng sáng tạo.', 450000, 140, 'Teacher9');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Lịch sử', N'Lịch sử Việt Nam hiện đại', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Tổng quan lịch sử Việt Nam thế kỷ XX và XXI.', 550000, DEFAULT, 'Teacher9');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Tin học', N'Tin học 12 ứng dụng văn phòng', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Sử dụng Word, Excel, PowerPoint hiệu quả trong học tập và thi cử.', 500000, DEFAULT, 'Teacher10');

INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Công nghệ', N'Công nghệ 12 - Lâm nghiệp, thuỷ sản', 'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png', N'Giới thiệu chung về lâm nghiệp; Trồng và chăm sóc rừng; Bảo vệ và khai thác tài nguyên rừng bền vững; Giới thiệu chung về thuỷ sản; Môi trường nuôi thuỷ sản; Công nghệ giống thuỷ sản; Công nghệ thức ăn thuỷ sản; Công nghệ nuôi thuỷ sản; Phòng, trị bệnh thuỷ sản; Bảo vệ và khai thác nguồn lợi thuỷ sản.', 400000, DEFAULT, 'Teacher6');

---------Bổ sung dữ liệu khóa học
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Toán', N'Toán 11 đại số', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1748266690/To%C3%A1n_jtqchi.png',
N'Hệ phương trình, bất phương trình, logarit và mũ cho lớp 11.', 600000, DEFAULT, 'Teacher2');

-- 2. Hóa học - Lớp 10 cơ bản
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Hóa học', N'Hóa học 10 cơ bản', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1748265930/Chemistry_vswrf7.png',
N'Cấu tạo nguyên tử, bảng tuần hoàn và liên kết hóa học.', 550000, DEFAULT, 'Teacher4');

-- 3. Tiếng Anh - Giao tiếp THPT
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Tiếng Anh', N'Tiếng Anh giao tiếp THPT', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1748266328/TiengAnh_cuoidu.png',
N'Luyện phản xạ và từ vựng tiếng Anh cho học sinh THPT.', 750000, DEFAULT, 'Teacher7');

-- 4. Sinh học - Lớp 11 tế bào nâng cao
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Sinh học', N'Sinh học 11 chuyên đề tế bào', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Chuyên đề về cấu trúc và chức năng tế bào nâng cao.', 500000, DEFAULT, 'Teacher6');

-- 5. Ngữ văn - Cảm thụ tác phẩm văn học 11
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Ngữ văn', N'Ngữ văn 11 cảm thụ văn học', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Kỹ năng đọc hiểu và phân tích tác phẩm văn học lớp 11.', 480000, DEFAULT, 'Teacher3');

-- 6. Lịch sử - Việt Nam hiện đại lớp 11
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Lịch sử', N'Lịch sử Việt Nam hiện đại lớp 11', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Tìm hiểu cách mạng, chiến tranh và xây dựng đất nước.', 420000, DEFAULT, 'Teacher1');

-- 7. Địa lý - Địa lý kinh tế xã hội lớp 10
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Địa lý', N'Địa lý kinh tế xã hội lớp 10', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Khái niệm và mối quan hệ giữa các yếu tố địa lý kinh tế.', 450000, DEFAULT, 'Teacher5');

-- 8. Công nghệ - Vẽ kỹ thuật lớp 11
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Công nghệ', N'Công nghệ 11 - Vẽ kỹ thuật', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Kỹ thuật vẽ hình chiếu, hình cắt và biểu diễn vật thể.', 500000, DEFAULT, 'Teacher8');

-- 9. Giáo dục công dân - Quyền và nghĩa vụ công dân
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Giáo dục công dân', N'GDCD 11 - Quyền công dân', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Tìm hiểu pháp luật và trách nhiệm của công dân trong xã hội.', 400000, DEFAULT, 'Teacher9');

-- 10. Tin học - Lập trình C++ lớp 12
INSERT INTO KhoaHoc (MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, GiaKhoaHoc, ThoiHan, MaGiaoVien)
VALUES (N'Tin học', N'Tin học 12 - Lập trình C++ cơ bản', 
N'https://res.cloudinary.com/druj32kwu/image/upload/v1747841841/unknown_g8spau.png',
N'Cấu trúc điều khiển, hàm và mảng trong ngôn ngữ lập trình C++.', 650000, DEFAULT, 'Teacher10');



CREATE TABLE Admin(
	MaAdmin				NVARCHAR(20)   NOT NULL PRIMARY KEY,  -- StudentXXX
    HoTen				NVARCHAR(200)  NOT NULL,
	PassHash			VARCHAR(MAX)	  NOT NULL,
	DuongDanAnhDaiDien  NVARCHAR(1000)  NULL,
    Email				NVARCHAR(200)  NOT NULL UNIQUE,
    DienThoai			NVARCHAR(50)   NULL
)
GO


SELECT *
FROM dbo.GiaoVien
ORDER BY CAST(SUBSTRING(MaGiaoVien, 8, LEN(MaGiaoVien) - 7) AS INT) ASC;

SELECT * FROM KhoaHoc
ORDER BY CAST(SUBSTRING(MaKhoaHoc, 7, LEN(MaKhoaHoc) - 6) AS INT) ASC;


select * from HocSinh
select * from KhoaHoc
delete HocSinh
insert into HocSinh (MaHocSinh, HoTen, PassHash, Email, DienThoai) values ('temp', 'aihsdou', 'AQAAAAIAAYagAAAAEDqz+C1ThrV2EwBVGwOuS7ErQDo7t6j9uUDNVY+h6bnK1L5Fx8b+9v+sHfle0g1JUA==', 'hasud@gmail.com', '487965');
update HocSinh set DuongDanAnhDaiDien = 'https://res.cloudinary.com/druj32kwu/image/upload/v1747840647/1_manaaf.jpg' where MaHocSinh = 'Student1'