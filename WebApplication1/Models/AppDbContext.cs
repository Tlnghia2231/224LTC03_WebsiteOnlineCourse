﻿using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Models;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<BaiHoc> BaiHocs { get; set; }

    public virtual DbSet<GiaoVien> GiaoViens { get; set; }

    public virtual DbSet<HocSinh> HocSinhs { get; set; }

    public virtual DbSet<KhoaHoc> KhoaHocs { get; set; }

    public virtual DbSet<KhoaHocHocSinh> KhoaHocHocSinhs { get; set; }

    public virtual DbSet<MucTieuKhoaHoc> MucTieuKhoaHocs { get; set; }

    public virtual DbSet<YeuCauKhoaHoc> YeuCauKhoaHocs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=TranLamNghia;Initial Catalog=QUANLYKHOAHOC;User ID=sa;Password=123456;Encrypt=False;TrustServerCertificate=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BaiHoc>(entity =>
        {
            entity.HasKey(e => e.MaBaiHoc).HasName("PK__BaiHoc__3F6433C2BD9B30C8");

            entity.ToTable("BaiHoc", tb => tb.HasTrigger("trg_BaiHoc_InsteadOfInsert"));

            entity.Property(e => e.MaBaiHoc).HasMaxLength(30);
            entity.Property(e => e.LinkVideo).HasMaxLength(1000);
            entity.Property(e => e.MaKhoaHoc).HasMaxLength(20);
            entity.Property(e => e.NgayTao)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TieuDe).HasMaxLength(200);

            entity.HasOne(d => d.MaKhoaHocNavigation).WithMany(p => p.BaiHocs)
                .HasForeignKey(d => d.MaKhoaHoc)
                .HasConstraintName("FK_BaiHoc_KhoaHoc");
        });

        modelBuilder.Entity<GiaoVien>(entity =>
        {
            entity.HasKey(e => e.MaGiaoVien).HasName("PK__GiaoVien__8D374F507C818449");

            entity.ToTable("GiaoVien", tb => tb.HasTrigger("trg_GiaoVien_InsteadOfInsert"));

            entity.HasIndex(e => e.Email, "UQ__GiaoVien__A9D10534377721FE").IsUnique();

            entity.Property(e => e.MaGiaoVien).HasMaxLength(20);
            entity.Property(e => e.DienThoai).HasMaxLength(50);
            entity.Property(e => e.DuongDanAnhDaiDien).HasMaxLength(1000);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.HoTen).HasMaxLength(200);
            entity.Property(e => e.NgayTao)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<HocSinh>(entity =>
        {
            entity.HasKey(e => e.MaHocSinh).HasName("PK__HocSinh__90BD01E011F2D9A3");

            entity.ToTable("HocSinh", tb => tb.HasTrigger("trg_HocSinh_InsteadOfInsert"));

            entity.HasIndex(e => e.Email, "UQ__HocSinh__A9D10534C87FB31E").IsUnique();

            entity.Property(e => e.MaHocSinh).HasMaxLength(20);
            entity.Property(e => e.DiaChi).HasMaxLength(500);
            entity.Property(e => e.DienThoai).HasMaxLength(50);
            entity.Property(e => e.Email).HasMaxLength(200);
            entity.Property(e => e.GioiTinh).HasMaxLength(10);
            entity.Property(e => e.HoTen).HasMaxLength(200);
            entity.Property(e => e.NgayDangKy)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<KhoaHoc>(entity =>
        {
            entity.HasKey(e => e.MaKhoaHoc).HasName("PK__KhoaHoc__48F0FF98909793BC");

            entity.ToTable("KhoaHoc", tb => tb.HasTrigger("trg_KhoaHoc_InsteadOfInsert"));

            entity.Property(e => e.MaKhoaHoc).HasMaxLength(20);
            entity.Property(e => e.DuongDanAnhKhoaHoc).HasMaxLength(1000);
            entity.Property(e => e.GiaKhoaHoc).HasColumnType("money");
            entity.Property(e => e.MaGiaoVien).HasMaxLength(20);
            entity.Property(e => e.MonHoc).HasMaxLength(100);
            entity.Property(e => e.NgayCapNhat)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ThoiHan).HasDefaultValue(150);
            entity.Property(e => e.TieuDe).HasMaxLength(300);

            entity.HasOne(d => d.MaGiaoVienNavigation).WithMany(p => p.KhoaHocs)
                .HasForeignKey(d => d.MaGiaoVien)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_KhoaHoc_GiaoVien");
        });

        modelBuilder.Entity<KhoaHocHocSinh>(entity =>
        {
            entity.HasKey(e => new { e.MaKhoaHoc, e.MaHocSinh }).HasName("PK__KhoaHoc___51FB2F86218D2800");

            entity.ToTable("KhoaHoc_HocSinh");

            entity.Property(e => e.MaKhoaHoc).HasMaxLength(20);
            entity.Property(e => e.MaHocSinh).HasMaxLength(20);
            entity.Property(e => e.NgayDangKy)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.NgayHetHan).HasColumnType("datetime");

            entity.HasOne(d => d.MaHocSinhNavigation).WithMany(p => p.KhoaHocHocSinhs)
                .HasForeignKey(d => d.MaHocSinh)
                .HasConstraintName("FK_KhoaHocHocSinh_HocSinh");

            entity.HasOne(d => d.MaKhoaHocNavigation).WithMany(p => p.KhoaHocHocSinhs)
                .HasForeignKey(d => d.MaKhoaHoc)
                .HasConstraintName("FK_KhoaHocHocSinh_KhoaHoc");
        });

        modelBuilder.Entity<MucTieuKhoaHoc>(entity =>
        {
            entity.HasKey(e => new { e.MaKhoaHoc, e.ThuTu }).HasName("PK__MucTieuK__5A127CA5A24E8DDF");

            entity.ToTable("MucTieuKhoaHoc");

            entity.Property(e => e.MaKhoaHoc).HasMaxLength(20);
            entity.Property(e => e.NoiDung).HasMaxLength(1000);

            entity.HasOne(d => d.MaKhoaHocNavigation).WithMany(p => p.MucTieuKhoaHocs)
                .HasForeignKey(d => d.MaKhoaHoc)
                .HasConstraintName("FK__MucTieuKh__MaKho__4222D4EF");
        });

        modelBuilder.Entity<YeuCauKhoaHoc>(entity =>
        {
            entity.HasKey(e => new { e.MaKhoaHoc, e.ThuTu }).HasName("PK__YeuCauKh__5A127CA578476128");

            entity.ToTable("YeuCauKhoaHoc");

            entity.Property(e => e.MaKhoaHoc).HasMaxLength(20);
            entity.Property(e => e.NoiDung).HasMaxLength(1000);

            entity.HasOne(d => d.MaKhoaHocNavigation).WithMany(p => p.YeuCauKhoaHocs)
                .HasForeignKey(d => d.MaKhoaHoc)
                .HasConstraintName("FK__YeuCauKho__MaKho__44FF419A");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
