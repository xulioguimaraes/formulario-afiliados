import mammoth from 'mammoth';

export interface TemplateData {
  // Dados pessoais/empresa do afiliado
  nomeCompleto: string;
  primeiroNome: string;
  sobrenome: string;
  cpf: string;
  email: string;
  telefone: string;

  // Dados da empresa
  razaoSocial: string;
  cnpj: string;
  paginaWeb: string;
  pais: string;

  // Endereço
  enderecoCompleto: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;

  // Dados bancários
  nomeBanco: string;
  codigoBanco: string;
  agencia: string;
  conta: string;
  chavePix: string;

  // Modelo de contrato
  modeloContratoCpa: string;
  modeloContratoRev: string;
  informacoesAdicionais: string;

  // Data atual
  dataAtual: string;

  // Dados fixos do parceiro
  parceiroRazaoSocial: string;
  parceiroCnpj: string;
  parceiroEndereco: string;
}

export async function processTemplate(templatePath: string, data: TemplateData): Promise<string> {
  try {
    // Buscar o template .docx
    const response = await fetch(templatePath);
    
    if (!response.ok) {
      throw new Error(`Template não encontrado: ${templatePath}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Converter DOCX para HTML usando mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    let htmlContent = result.value;
    
    // Substituir placeholders pelos dados
    htmlContent = htmlContent.replace(/\{(\w+)\}/g, (match, key) => {
      const value = (data as unknown as Record<string, unknown>)[key];
      return value !== undefined ? String(value) : match;
    });
    
    return htmlContent;
  } catch (error) {
    console.error('Erro ao processar template:', error);
    throw error;
  }
}

export function prepareTemplateData(formData: Record<string, unknown>): TemplateData {
  return {
    // Dados pessoais/empresa do afiliado
    nomeCompleto: `${String(formData.primeiroNome || '')} ${String(formData.sobrenome || '')}`,
    primeiroNome: String(formData.primeiroNome || ''),
    sobrenome: String(formData.sobrenome || ''),
    cpf: String(formData.cpf || ''),
    email: String(formData.email || ''),
    telefone: `${String(formData.codigoPais || '')} ${String(formData.telefone || '')}`,

    // Dados da empresa
    razaoSocial: String(formData.razaoSocial || ""),
    cnpj: String(formData.cnpj || ""),
    paginaWeb: String(formData.paginaWeb || ""),
    pais: String(formData.pais || ""),

    // Endereço
    enderecoCompleto: String(formData.enderecoCompleto || ''),
    bairro: String(formData.bairro || ''),
    cidade: String(formData.cidade || ''),
    estado: String(formData.estado || ''),
    cep: String(formData.cep || ''),

    // Dados bancários
    nomeBanco: String(formData.nomeBanco || ''),
    codigoBanco: String(formData.codigoBanco || ''),
    agencia: String(formData.agencia || ''),
    conta: String(formData.conta || ''),
    chavePix: String(formData.chavePix || "Não informada"),

    // Modelo de contrato
    modeloContratoCpa: String(formData.modeloContratoCpa || ''),
    modeloContratoRev: String(formData.modeloContratoRev || ''),
    informacoesAdicionais: String(formData.informacoesAdicionais || ""),

    // Data atual
    dataAtual: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),

    // Dados fixos do parceiro
    parceiroRazaoSocial: "JOGO PRINCIPAL LTDA",
    parceiroCnpj: "56.302.709/0001-04",
    parceiroEndereco: "Avenida Paulista, nº 1636, sala 1504, Bela Vista – SP, CEP 01.310-200",
  };
}
