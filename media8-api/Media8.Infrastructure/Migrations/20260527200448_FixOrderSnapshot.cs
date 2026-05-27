using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Media8.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixOrderSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No-op: A coluna VideoFormatId já foi removida anteriormente
            // Esta migration apenas atualiza o snapshot do EF Core para refletir
            // que Order NÃO tem mais relação com VideoFormat
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: Não há rollback pois a remoção foi intencional e definitiva
            // O VideoFormat é obtido via: Order → ServiceBalanceLot → ClientContract → SnapshotVideoFormatName
        }
    }
}
