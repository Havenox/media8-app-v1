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
            // Remove coluna VideoFormatId da tabela Orders (não é mais necessária)
            migrationBuilder.DropColumn(
                name: "VideoFormatId",
                table: "Orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Adiciona coluna VideoFormatId de volta (rollback)
            migrationBuilder.AddColumn<Guid>(
                name: "VideoFormatId",
                table: "Orders",
                type: "uuid",
                nullable: false,
                defaultValue: Guid.Empty);
        }
    }
}