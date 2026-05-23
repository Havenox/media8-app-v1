using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileLinksToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BrandingProfileId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EditingProfileId",
                table: "Orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_BrandingProfileId",
                table: "Orders",
                column: "BrandingProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_EditingProfileId",
                table: "Orders",
                column: "EditingProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_BrandingProfiles_BrandingProfileId",
                table: "Orders",
                column: "BrandingProfileId",
                principalTable: "BrandingProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_EditingProfiles_EditingProfileId",
                table: "Orders",
                column: "EditingProfileId",
                principalTable: "EditingProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_BrandingProfiles_BrandingProfileId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_EditingProfiles_EditingProfileId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_BrandingProfileId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_EditingProfileId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "BrandingProfileId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "EditingProfileId",
                table: "Orders");
        }
    }
}
