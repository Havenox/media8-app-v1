using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveVideoFormatIdFromOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_VideoFormats_VideoFormatId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_VideoFormats_EditingStyles_EditingStyleId",
                table: "VideoFormats");

            migrationBuilder.DropForeignKey(
                name: "FK_VideoFormats_Offers_OfferId",
                table: "VideoFormats");

            migrationBuilder.DropIndex(
                name: "IX_VideoFormats_EditingStyleId",
                table: "VideoFormats");

            migrationBuilder.DropIndex(
                name: "IX_VideoFormats_OfferId",
                table: "VideoFormats");

            migrationBuilder.DropColumn(
                name: "EditingStyleId",
                table: "VideoFormats");

            migrationBuilder.DropColumn(
                name: "OfferId",
                table: "VideoFormats");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "VideoFormats",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<Guid>(
                name: "VideoFormatId",
                table: "Orders",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_VideoFormats_VideoFormatId",
                table: "Orders",
                column: "VideoFormatId",
                principalTable: "VideoFormats",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_VideoFormats_VideoFormatId",
                table: "Orders");

            migrationBuilder.AlterColumn<string>(
                name: "Slug",
                table: "VideoFormats",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "EditingStyleId",
                table: "VideoFormats",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OfferId",
                table: "VideoFormats",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "VideoFormatId",
                table: "Orders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoFormats_EditingStyleId",
                table: "VideoFormats",
                column: "EditingStyleId");

            migrationBuilder.CreateIndex(
                name: "IX_VideoFormats_OfferId",
                table: "VideoFormats",
                column: "OfferId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_VideoFormats_VideoFormatId",
                table: "Orders",
                column: "VideoFormatId",
                principalTable: "VideoFormats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VideoFormats_EditingStyles_EditingStyleId",
                table: "VideoFormats",
                column: "EditingStyleId",
                principalTable: "EditingStyles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_VideoFormats_Offers_OfferId",
                table: "VideoFormats",
                column: "OfferId",
                principalTable: "Offers",
                principalColumn: "Id");
        }
    }
}
