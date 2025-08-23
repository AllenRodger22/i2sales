import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface KpiData {
  vgvTotal: number;
  numeroLigacoes: number;
  numeroDocumentos: number;
  totalVendas: number;
  ticketMedio?: number;
  tempoMedioFechamento?: number;
}

interface FunnelData {
  ligacoes: number;
  atendimentos: number;
  interessados: number;
  documentacao: number;
  vendas: number;
  conversoes: {
    ligacaoParaAtendimento: number;
    atendimentoParaInteressado: number;
    interessadoParaDocumentacao: number;
    documentacaoParaVenda: number;
  };
}

export const exportBiDataToCsv = (
  kpiData: KpiData,
  funnelData: FunnelData,
  startDate: string,
  endDate: string,
  selectedUser?: string
) => {
  const headers = ['Métrica', 'Valor'];
  let csvContent = headers.join(',') + '\n';
  
  csvContent += `VGV Total,${kpiData.vgvTotal}\n`;
  csvContent += `Número de Ligações,${kpiData.numeroLigacoes}\n`;
  csvContent += `Número de Documentos,${kpiData.numeroDocumentos}\n`;
  csvContent += `Total de Vendas,${kpiData.totalVendas}\n`;
  csvContent += `Ticket Médio,${kpiData.ticketMedio || 0}\n`;
  csvContent += `Tempo Médio Fechamento (dias),${kpiData.tempoMedioFechamento || 0}\n`;
  
  csvContent += `\nFunil de Vendas,\n`;
  csvContent += `Ligações,${funnelData.ligacoes}\n`;
  csvContent += `Atendimentos,${funnelData.atendimentos}\n`;
  csvContent += `Interessados,${funnelData.interessados}\n`;
  csvContent += `Documentação,${funnelData.documentacao}\n`;
  csvContent += `Vendas,${funnelData.vendas}\n`;
  
  csvContent += `\nTaxas de Conversão,\n`;
  csvContent += `Ligação → Atendimento,${funnelData.conversoes.ligacaoParaAtendimento}%\n`;
  csvContent += `Atendimento → Interessado,${funnelData.conversoes.atendimentoParaInteressado}%\n`;
  csvContent += `Interessado → Documentação,${funnelData.conversoes.interessadoParaDocumentacao}%\n`;
  csvContent += `Documentação → Venda,${funnelData.conversoes.documentacaoParaVenda}%\n`;
  
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  const userFilter = selectedUser ? '_usuario_filtrado' : '';
  link.setAttribute('download', `bi_dashboard_${startDate}_${endDate}${userFilter}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportBiDataToPdf = (
  kpiData: KpiData,
  funnelData: FunnelData,
  startDate: string,
  endDate: string,
  selectedUser?: string
) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Dashboard BI - i2Sales CRM', 20, 20);
  doc.setFontSize(12);
  doc.text(`Período: ${startDate} a ${endDate}`, 20, 30);
  if (selectedUser) {
    doc.text(`Usuário: ${selectedUser}`, 20, 40);
  }
  
  const kpiTableData = [
    ['VGV Total', `R$ ${kpiData.vgvTotal.toLocaleString('pt-BR')}`],
    ['Número de Ligações', kpiData.numeroLigacoes.toString()],
    ['Número de Documentos', kpiData.numeroDocumentos.toString()],
    ['Total de Vendas', kpiData.totalVendas.toString()],
    ['Ticket Médio', `R$ ${(kpiData.ticketMedio || 0).toLocaleString('pt-BR')}`],
    ['Tempo Médio Fechamento', `${kpiData.tempoMedioFechamento || 0} dias`]
  ];
  
  (doc as any).autoTable({
    head: [['KPI', 'Valor']],
    body: kpiTableData,
    startY: selectedUser ? 50 : 40,
    theme: 'grid'
  });
  
  const funnelTableData = [
    ['Ligações', funnelData.ligacoes.toString()],
    ['Atendimentos', funnelData.atendimentos.toString()],
    ['Interessados', funnelData.interessados.toString()],
    ['Documentação', funnelData.documentacao.toString()],
    ['Vendas', funnelData.vendas.toString()]
  ];
  
  (doc as any).autoTable({
    head: [['Etapa do Funil', 'Quantidade']],
    body: funnelTableData,
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: 'grid'
  });
  
  const conversionTableData = [
    ['Ligação → Atendimento', `${funnelData.conversoes.ligacaoParaAtendimento}%`],
    ['Atendimento → Interessado', `${funnelData.conversoes.atendimentoParaInteressado}%`],
    ['Interessado → Documentação', `${funnelData.conversoes.interessadoParaDocumentacao}%`],
    ['Documentação → Venda', `${funnelData.conversoes.documentacaoParaVenda}%`]
  ];
  
  (doc as any).autoTable({
    head: [['Conversão', 'Taxa']],
    body: conversionTableData,
    startY: (doc as any).lastAutoTable.finalY + 10,
    theme: 'grid'
  });
  
  const userFilter = selectedUser ? '_usuario_filtrado' : '';
  doc.save(`bi_dashboard_${startDate}_${endDate}${userFilter}.pdf`);
};

export const exportBiDataToExcel = (
  kpiData: KpiData,
  funnelData: FunnelData,
  startDate: string,
  endDate: string,
  selectedUser?: string
) => {
  const wb = XLSX.utils.book_new();
  
  const kpiData_ws = [
    ['KPI', 'Valor'],
    ['VGV Total', kpiData.vgvTotal],
    ['Número de Ligações', kpiData.numeroLigacoes],
    ['Número de Documentos', kpiData.numeroDocumentos],
    ['Total de Vendas', kpiData.totalVendas],
    ['Ticket Médio', kpiData.ticketMedio || 0],
    ['Tempo Médio Fechamento (dias)', kpiData.tempoMedioFechamento || 0]
  ];
  
  const funnelData_ws = [
    ['Etapa do Funil', 'Quantidade'],
    ['Ligações', funnelData.ligacoes],
    ['Atendimentos', funnelData.atendimentos],
    ['Interessados', funnelData.interessados],
    ['Documentação', funnelData.documentacao],
    ['Vendas', funnelData.vendas]
  ];
  
  const conversionData_ws = [
    ['Conversão', 'Taxa (%)'],
    ['Ligação → Atendimento', funnelData.conversoes.ligacaoParaAtendimento],
    ['Atendimento → Interessado', funnelData.conversoes.atendimentoParaInteressado],
    ['Interessado → Documentação', funnelData.conversoes.interessadoParaDocumentacao],
    ['Documentação → Venda', funnelData.conversoes.documentacaoParaVenda]
  ];
  
  const ws1 = XLSX.utils.aoa_to_sheet(kpiData_ws);
  const ws2 = XLSX.utils.aoa_to_sheet(funnelData_ws);
  const ws3 = XLSX.utils.aoa_to_sheet(conversionData_ws);
  
  XLSX.utils.book_append_sheet(wb, ws1, 'KPIs');
  XLSX.utils.book_append_sheet(wb, ws2, 'Funil');
  XLSX.utils.book_append_sheet(wb, ws3, 'Conversões');
  
  const userFilter = selectedUser ? '_usuario_filtrado' : '';
  XLSX.writeFile(wb, `bi_dashboard_${startDate}_${endDate}${userFilter}.xlsx`);
};
