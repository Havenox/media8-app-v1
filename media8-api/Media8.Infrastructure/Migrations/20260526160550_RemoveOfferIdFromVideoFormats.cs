using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOfferIdFromVideoFormats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove OfferId column (reverse navigation that shouldn't exist)
            migrationBuilder.DropForeignKey(
                name: "FK_VideoFormats_Offers_OfferId",
                table: "VideoFormats");

            migrationBuilder.DropIndex(
                name: "IX_VideoFormats_OfferId",
                table: "VideoFormats");

            migrationBuilder.DropColumn(
                name: "OfferId",
                table: "VideoFormats");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add column back
            migrationBuilder.AddColumn<Guid>(
                name: "OfferId",
                table: "VideoFormats",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VideoFormats_OfferId",
                table: "VideoFormats",
                column: "OfferId");

            migrationBuilder.AddForeignKey(
                name: "FK_VideoFormats_Offers_OfferId",
                table: "VideoFormats",
                column: "OfferId",
                principalTable: "Offers",
                principalColumn: "Id");
        }
    }
}
