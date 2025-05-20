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
	GiaKhoaHoc			MONEY			NOT NULL DEFAULT 0,
    ThoiHan				INT				NOT NULL DEFAULT 150,  -- đơn vị: ngày
    MaGiaoVien			NVARCHAR(20)    NOT NULL,            -- FK → GiaoVien
    SoLuongBaiHoc       INT             NOT NULL DEFAULT 0,
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

CREATE TRIGGER trg_HocSinh_InsteadOfInsert
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
        (MaHocSinh, HoTen, Email, DienThoai, NgaySinh, GioiTinh, DiaChi, NgayDangKy)
    SELECT
        COALESCE(i.MaHocSinh, 'Student' + CAST(@MaxID + i.RowNum AS VARCHAR)),
        i.HoTen, i.Email, i.DienThoai, i.NgaySinh, i.GioiTinh, i.DiaChi,
        GETDATE()
    FROM InsertedWithIndex AS i;
END;
GO

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
      (MaKhoaHoc, MonHoc, TieuDe, DuongDanAnhKhoaHoc, MoTa, MaGiaoVien, SoLuongBaiHoc, NgayCapNhat)
    SELECT
      COALESCE(i.MaKhoaHoc,
        'Course' + RIGHT(CAST(@baseMax + ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS VARCHAR(3)),3)
      ),
      i.MonHoc, i.TieuDe, i.DuongDanAnhKhoaHoc, i.MoTa, i.MaGiaoVien, 0, GETDATE()
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

    -- Cập nhật số lượng bài học cho từng khóa học liên quan
    UPDATE kh
    SET kh.SoLuongBaiHoc = kh.SoLuongBaiHoc + cnt.SoLuongMoi
    FROM dbo.KhoaHoc kh
    JOIN (
        SELECT MaKhoaHoc, COUNT(*) AS SoLuongMoi
        FROM inserted
        GROUP BY MaKhoaHoc
    ) AS cnt
    ON kh.MaKhoaHoc = cnt.MaKhoaHoc;
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