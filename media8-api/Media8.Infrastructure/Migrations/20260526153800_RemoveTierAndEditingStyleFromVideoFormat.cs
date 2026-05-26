using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTierAndEditingStyleFromVideoFormat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key first
            migrationBuilder.DropForeignKey(
                name: "FK_VideoFormats_EditingStyles_EditingStyleId",
                table: "VideoFormats");

            // Drop the column
            migrationBuilder.DropColumn(
                name: "EditingStyleId",
                table: "VideoFormats");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add the column back
            migrationBuilder.AddColumn<Guid>(
                name: "EditingStyleId",
                table: "VideoFormats",
                type: "uuid",
                nullable: true);

            // Recreate foreign key
            migrationBuilder.AddForeignKey(
                name: "FK_VideoFormats_EditingStyles_EditingStyleId",
                table: "VideoFormats",
                column: "EditingStyleId",
                principalTable: "EditingStyles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
