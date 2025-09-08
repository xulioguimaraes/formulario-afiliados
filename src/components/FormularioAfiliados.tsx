"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import AssinaturaDigital from "./AssinaturaDigital";
import { createReport } from "docx-templates";
import {
  processTemplate,
  prepareTemplateData,
} from "../utils/templateProcessor";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Tipos para os dados do formulário
interface DadosPessoais {
  primeiroNome: string;
  sobrenome: string;
  cpf: string;
  email: string;
  codigoPais: string;
  telefone: string;
}

interface DadosEmpresa {
  razaoSocial: string;
  cnpj: string;
  paginaWeb: string;
  pais: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  enderecoCompleto: string;
  nomeBanco: string;
  codigoBanco: string;
  agencia: string;
  conta: string;
  chavePix: string;
  modeloContratoCpa: string;
  modeloContratoRev: string;
  informacoesAdicionais: string;
  assinaturaDigital: string | null;
}

type FormData = DadosPessoais & DadosEmpresa;

const codigosPaises = [
  { value: "+55", label: "Brasil (+55)" },
  { value: "+1", label: "Estados Unidos (+1)" },
  { value: "+54", label: "Argentina (+54)" },
  { value: "+56", label: "Chile (+56)" },
  { value: "+57", label: "Colômbia (+57)" },
  { value: "+51", label: "Peru (+51)" },
  { value: "+598", label: "Uruguai (+598)" },
  { value: "+595", label: "Paraguai (+595)" },
];

const paises = [
  "Brasil",
  "Argentina",
  "Chile",
  "Colômbia",
  "Peru",
  "Uruguai",
  "Paraguai",
  "Estados Unidos",
  "México",
];

const opcoesContratoCpa = [
  "30/30",
  "40/40",
  "50/50",
  "60/60",
  "70/70",
  "80/80",
  "90/90",
  "100/100",
  "110/110",
  "30/110",
];

const opcoesContratoRev = [
  "30%",
  "31%",
  "32%",
  "33%",
  "34%",
  "35%",
  "36%",
  "37%",
  "38%",
  "39%",
  "40%",
];

export default function FormularioAfiliados() {
  const [etapaAtual, setEtapaAtual] = useState<1 | 2>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<"termos" | "contrato">(
    "termos"
  );
  const [termosContent, setTermosContent] = useState<string>("");
  const [contratoContent, setContratoContent] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormData>();

  const proximaEtapa = async () => {
    const camposEtapa1: (keyof DadosPessoais)[] = [
      "primeiroNome",
      "sobrenome",
      "cpf",
      "email",
      "codigoPais",
      "telefone",
    ];

    const isValid = await trigger(camposEtapa1);
    if (isValid) {
      setEtapaAtual(2);
    }
  };

  const voltarEtapa = () => {
    setEtapaAtual(1);
  };

  const gerarConteudoTermos = (data: FormData) => {
    return `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">TERMOS E CONDIÇÕES</h1>
        <h2 style="font-size: 16px; font-weight: bold; color: #666;">PROGRAMA DE AFILIADOS</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">DADOS DO AFILIADO</h3>
        <p><strong>Nome Completo:</strong> ${data.primeiroNome} ${
      data.sobrenome
    }</p>
        <p><strong>CPF:</strong> ${data.cpf}</p>
        <p><strong>E-mail:</strong> ${data.email}</p>
        <p><strong>Telefone:</strong> ${data.codigoPais} ${data.telefone}</p>
        <p><strong>Razão Social:</strong> ${data.razaoSocial}</p>
        <p><strong>CNPJ:</strong> ${data.cnpj}</p>
        <p><strong>Endereço:</strong> ${data.enderecoCompleto}, ${
      data.bairro
    }, ${data.cidade} - ${data.estado}, CEP: ${data.cep}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">DADOS BANCÁRIOS</h3>
        <p><strong>Banco:</strong> ${data.nomeBanco} (${data.codigoBanco})</p>
        <p><strong>Agência:</strong> ${data.agencia}</p>
        <p><strong>Conta:</strong> ${data.conta}</p>
        <p><strong>PIX:</strong> ${data.chavePix || "Não informada"}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">TERMOS E CONDIÇÕES</h3>
        <p>1. O afiliado concorda em cumprir todas as diretrizes do programa de afiliados.</p>
        <p>2. O afiliado é responsável por manter a confidencialidade de suas credenciais.</p>
        <p>3. O afiliado concorda em não divulgar informações confidenciais da empresa.</p>
        <p>4. O afiliado deve seguir todas as leis e regulamentações aplicáveis.</p>
        <p>5. A empresa se reserva o direito de encerrar o contrato a qualquer momento.</p>
      </div>

      <div style="margin-top: 40px;">
        <p><strong>Assinatura Digital:</strong></p>
        ${
          data.assinaturaDigital
            ? `<img src="${data.assinaturaDigital}" style="max-width: 200px; max-height: 80px; border: 1px solid #ccc;" />`
            : '<p style="color: red;">Assinatura não encontrada</p>'
        }
      </div>
    `;
  };

  const gerarConteudoContrato = (data: FormData) => {
    return `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">CONTRATO DE AFILIAÇÃO</h1>
        <h2 style="font-size: 16px; font-weight: bold; color: #666;">PROGRAMA DE AFILIADOS</h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PARTES CONTRATANTES</h3>
        <p><strong>CONTRATANTE:</strong> JOGO PRINCIPAL LTDA</p>
        <p><strong>CNPJ:</strong> 56.302.709/0001-04</p>
        <p><strong>Endereço:</strong> Avenida Paulista, nº 1636, sala 1504, Bela Vista – SP, CEP 01.310-200</p>
        <br>
        <p><strong>CONTRATADO:</strong> ${data.razaoSocial}</p>
        <p><strong>CNPJ:</strong> ${data.cnpj}</p>
        <p><strong>Representante:</strong> ${data.primeiroNome} ${
      data.sobrenome
    }</p>
        <p><strong>CPF:</strong> ${data.cpf}</p>
        <p><strong>Endereço:</strong> ${data.enderecoCompleto}, ${
      data.bairro
    }, ${data.cidade} - ${data.estado}, CEP: ${data.cep}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">CONDIÇÕES COMERCIAIS</h3>
        <p><strong>Modelo CPA:</strong> ${data.modeloContratoCpa}</p>
        <p><strong>Modelo REV:</strong> ${data.modeloContratoRev}</p>
        <p><strong>Dados Bancários:</strong> ${data.nomeBanco} (${
      data.codigoBanco
    }) - Ag: ${data.agencia} - CC: ${data.conta}</p>
        <p><strong>PIX:</strong> ${data.chavePix || "Não informada"}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">CLÁUSULAS DO CONTRATO</h3>
        <p>1. O contratado se compromete a promover os produtos/serviços da contratante.</p>
        <p>2. A remuneração será paga conforme modelo ${
          data.modeloContratoCpa
        } para CPA e ${data.modeloContratoRev} para REV.</p>
        <p>3. O pagamento será realizado mensalmente via transferência bancária.</p>
        <p>4. O contrato tem vigência de 12 meses, renovável automaticamente.</p>
        <p>5. Qualquer das partes pode rescindir o contrato com 30 dias de antecedência.</p>
      </div>

      ${
        data.informacoesAdicionais
          ? `
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">INFORMAÇÕES ADICIONAIS</h3>
          <p>${data.informacoesAdicionais}</p>
        </div>
      `
          : ""
      }

      <div style="margin-top: 40px;">
        <p><strong>Assinatura Digital:</strong></p>
        ${
          data.assinaturaDigital
            ? `<img src="${data.assinaturaDigital}" style="max-width: 200px; max-height: 80px; border: 1px solid #ccc;" />`
            : '<p style="color: red;">Assinatura não encontrada</p>'
        }
      </div>
    `;
  };

  const baixarTemplateDOCX = async (
    data: FormData,
    nomeTemplate: string,
    sufixoArquivo: string
  ) => {
    try {
      // Buscar o template .docx
      const response = await fetch(`/templates/${nomeTemplate}`);

      if (!response.ok) {
        throw new Error(
          `Template ${nomeTemplate} não encontrado. Certifique-se de que o arquivo está na pasta public/templates/`
        );
      }

      const templateBuffer = await response.arrayBuffer();

      // Preparar os dados para preencher o template
      const dadosContrato = {
        // Dados pessoais/empresa do afiliado
        nomeCompleto: `${data.primeiroNome} ${data.sobrenome}`,
        primeiroNome: data.primeiroNome,
        sobrenome: data.sobrenome,
        cpf: data.cpf,
        email: data.email,
        telefone: `${data.codigoPais} ${data.telefone}`,

        // Dados da empresa
        razaoSocial: data.razaoSocial || "",
        cnpj: data.cnpj || "",
        paginaWeb: data.paginaWeb || "",
        pais: data.pais,

        // Endereço
        enderecoCompleto: data.enderecoCompleto,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,

        // Dados bancários
        nomeBanco: data.nomeBanco,
        codigoBanco: data.codigoBanco,
        agencia: data.agencia,
        conta: data.conta,
        chavePix: data.chavePix || "Não informada",

        // Modelo de contrato
        modeloContratoCpa: data.modeloContratoCpa,
        modeloContratoRev: data.modeloContratoRev,
        informacoesAdicionais: data.informacoesAdicionais || "",

        // Data atual
        dataAtual: new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),

        // Dados fixos do parceiro
        parceiroRazaoSocial: "JOGO PRINCIPAL LTDA",
        parceiroCnpj: "56.302.709/0001-04",
        parceiroEndereco:
          "Avenida Paulista, nº 1636, sala 1504, Bela Vista – SP, CEP 01.310-200",

        // Assinatura digital será processada via additionalJsContext
      };

      // Gerar o documento preenchido
      const report = await createReport({
        template: new Uint8Array(templateBuffer),
        data: dadosContrato,
        cmdDelimiter: ["{", "}"], // Usar chaves para os placeholders
        additionalJsContext: {
          assinaturaDigital: () => {
            if (!data.assinaturaDigital) {
              return null;
            }

            const base64Data = data.assinaturaDigital.includes(",")
              ? data.assinaturaDigital.split(",")[1]
              : data.assinaturaDigital;

            return {
              width: 6, // Largura em cm
              height: 2, // Altura em cm
              data: base64Data,
              extension: ".png",
            };
          },
        },
      });

      // Criar blob e fazer download
      const blob = new Blob([report as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sufixoArquivo}_${data.primeiroNome}_${
        data.sobrenome
      }_${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Retornar o blob para conversão para PDF
      return blob;
    } catch (error) {
      console.error(`Erro ao baixar ${sufixoArquivo}:`, error);
      alert(
        `Erro ao baixar ${sufixoArquivo}. Verifique se o template está disponível.`
      );
      return null;
    }
  };

  const converterDOCXParaPDF = async (
    data: FormData,
    tipoDocumento: "termos" | "contrato",
    sufixoArquivo: string
  ) => {
    try {
      // Usar o conteúdo HTML já processado dos templates
      const conteudoHTML =
        tipoDocumento === "termos" ? termosContent : contratoContent;

      if (!conteudoHTML) {
        throw new Error("Conteúdo HTML não disponível para conversão");
      }

      // Criar um elemento temporário para renderizar o documento
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "210mm"; // A4 width
      tempDiv.style.padding = "20mm";
      tempDiv.style.fontFamily = "Arial, sans-serif";
      tempDiv.style.fontSize = "12px";
      tempDiv.style.lineHeight = "1.4";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.color = "black";
      tempDiv.style.minHeight = "297mm"; // A4 height

      // Adicionar estilos CSS para preservar formatação
      const style = document.createElement("style");
      style.textContent = `
        .docx-content {
          font-family: 'Times New Roman', serif;
          line-height: 1.5;
          color: black;
        }
        .docx-content h1, .docx-content h2, .docx-content h3 {
          font-weight: bold;
          margin: 10px 0;
        }
        .docx-content p {
          margin: 5px 0;
        }
        .docx-content strong {
          font-weight: bold;
        }
        .docx-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        .docx-content td, .docx-content th {
          border: 1px solid #ccc;
          padding: 5px;
        }
      `;
      document.head.appendChild(style);

      tempDiv.className = "docx-content";
      tempDiv.innerHTML = conteudoHTML;
      document.body.appendChild(tempDiv);

      // Aguardar um pouco para garantir que o conteúdo seja renderizado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Gerar PDF usando html2canvas e jsPDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Fazer download do PDF
      const nomeArquivo = `${sufixoArquivo}_${data.primeiroNome}_${
        data.sobrenome
      }_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(nomeArquivo);

      // Limpar elementos temporários
      document.body.removeChild(tempDiv);
      document.head.removeChild(style);
    } catch (error) {
      console.error(`Erro ao converter ${tipoDocumento} para PDF:`, error);
      alert(`Erro ao converter ${tipoDocumento} para PDF. Tente novamente.`);
    }
  };

  const baixarTodosDocumentos = async (data: FormData) => {
    setIsGenerating(true);

    try {
      // Baixar o primeiro documento - Termos e Condições (DOCX)
      setLoadingMessage("Baixando Termos e Condições (DOCX)...");

      await baixarTemplateDOCX(
        data,
        "termo_e_condicoes.docx",
        "termo_e_condicoes"
      );

      // Converter para PDF
      setLoadingMessage("Convertendo Termos e Condições para PDF...");

      await converterDOCXParaPDF(data, "termos", "termo_e_condicoes");

      // Aguardar um pouco para não sobrecarregar
      setLoadingMessage("Preparando Contrato de Afiliação...");

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Baixar o segundo documento - Contrato (DOCX)
      setLoadingMessage("Baixando Contrato de Afiliação (DOCX)...");

      await baixarTemplateDOCX(
        data,
        "contrato_afiliado.docx",
        "contrato_afiliado"
      );

      // Converter para PDF
      setLoadingMessage("Convertendo Contrato de Afiliação para PDF...");

      await converterDOCXParaPDF(data, "contrato", "contrato_afiliado");

      // Finalizar
      setLoadingMessage("Todos os documentos foram gerados com sucesso!");

      // Aguardar um pouco antes de remover o loading
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Erro ao gerar documentos:", error);
      setLoadingMessage("Erro ao gerar documentos. Tente novamente.");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
      setIsGenerating(false);
      setLoadingMessage("");
    }
  };

  const loadTemplates = async (data: FormData) => {
    setIsLoadingTemplates(true);
    try {
      const templateData = prepareTemplateData(
        data as unknown as Record<string, unknown>
      );

      // Processar ambos os templates
      const [termos, contrato] = await Promise.all([
        processTemplate("/templates/termo_e_condicoes.docx", templateData),
        processTemplate("/templates/contrato_afiliado.docx", templateData),
      ]);

      setTermosContent(termos);
      setContratoContent(contrato);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      // Fallback para conteúdo estático em caso de erro
      setTermosContent(gerarConteudoTermos(data));
      setContratoContent(gerarConteudoContrato(data));
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setFormData(data);
    setShowTemplatesModal(true);
    await loadTemplates(data);
  };

  const handleAcceptTemplates = () => {
    setShowTemplatesModal(false);
    setShowSignatureModal(true);
  };

  const handleSignatureChange = (signature: string | null) => {
    setCurrentSignature(signature);
  };

  const handleConfirmSignature = async () => {
    if (!currentSignature || !formData) return;

    setShowSignatureModal(false);

    const dataComAssinatura = {
      ...formData,
      assinaturaDigital: currentSignature,
    };

    await baixarTodosDocumentos(dataComAssinatura);
  };

  return (
    <div className="min-h-screen bg-gray-[#17191d] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray- rounded-2xl shadow-xl overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] px-8 py-6">
            <h1 className="text-2xl font-bold text-white text-center">
              Seja um parceiro
            </h1>
            <p className="text-orange-100 text-center mt-2">
              Preencha o formulário e aguarde o contato do gerente
            </p>
          </div>

          {/* Indicador de etapas */}
          <div className="px-8 py-4 bg-[#41474e] border-b border-gray-600">
            <div className="flex items-center justify-center space-x-4">
              <div
                className={`flex items-center ${
                  etapaAtual === 1 ? "text-orange-400" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    etapaAtual === 1
                      ? "bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  1
                </div>
                <span className="ml-2 font-medium text-gray-200">
                  Dados Pessoais
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-600"></div>
              <div
                className={`flex items-center ${
                  etapaAtual === 2 ? "text-orange-400" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    etapaAtual === 2
                      ? "bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  2
                </div>
                <span className="ml-2 font-medium text-gray-200">
                  Dados da Empresa
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-8 bg-gray-[#1a1e23]"
          >
            {etapaAtual === 1 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-100 mb-1">
                  Dados Pessoais do Responsável
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Primeiro nome *
                    </label>
                    <input
                      {...register("primeiroNome", {
                        required: "Campo obrigatório",
                      })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="Digite seu primeiro nome"
                    />
                    {errors.primeiroNome && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.primeiroNome.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Sobrenome *
                    </label>
                    <input
                      {...register("sobrenome", {
                        required: "Campo obrigatório",
                      })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="Digite seu sobrenome"
                    />
                    {errors.sobrenome && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.sobrenome.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    CPF *
                  </label>
                  <input
                    {...register("cpf", { required: "Campo obrigatório" })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.cpf.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    E-mail *
                  </label>
                  <input
                    {...register("email", {
                      required: "Campo obrigatório",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "E-mail inválido",
                      },
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Código do País *
                    </label>
                    <select
                      {...register("codigoPais", {
                        required: "Campo obrigatório",
                      })}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white bg-[#41474e] h-[50px] outline-none"
                    >
                      <option value="" className="bg-[#41474e] text-white">
                        Selecione
                      </option>
                      {codigosPaises.map((codigo) => (
                        <option
                          key={codigo.value}
                          value={codigo.value}
                          className="bg-[#41474e] text-white"
                        >
                          {codigo.label}
                        </option>
                      ))}
                    </select>
                    {errors.codigoPais && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.codigoPais.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Número de telefone *
                    </label>
                    <input
                      {...register("telefone", {
                        required: "Campo obrigatório",
                      })}
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="(11) 99999-9999"
                    />
                    {errors.telefone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.telefone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="button"
                    onClick={proximaEtapa}
                    className="px-8 py-3 bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] text-white font-semibold rounded-lg hover:from-[#ffb800] hover:to-[#ff8500] transition duration-200 shadow-lg hover:shadow-xl outline-none focus:ring-2 focus:ring-[#ffc22a]"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}

            {etapaAtual === 2 && (
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-100 mb-6">
                  Dados da Empresa
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Razão Social *
                    </label>
                    <input
                      {...register("razaoSocial", {
                        required: "Campo obrigatório",
                      })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="Nome da empresa"
                    />
                    {errors.razaoSocial && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.razaoSocial.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      CNPJ *
                    </label>
                    <input
                      {...register("cnpj", { required: "Campo obrigatório" })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.cnpj && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.cnpj.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Página Web
                    </label>
                    <input
                      {...register("paginaWeb")}
                      type="url"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="https://www.exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      País *
                    </label>
                    <select
                      {...register("pais", { required: "Campo obrigatório" })}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white bg-[#41474e] h-[50px] outline-none"
                    >
                      <option value="" className="bg-[#41474e] text-white">
                        Selecione
                      </option>
                      {paises.map((pais) => (
                        <option
                          key={pais}
                          value={pais}
                          className="bg-[#41474e] text-white"
                        >
                          {pais}
                        </option>
                      ))}
                    </select>
                    {errors.pais && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.pais.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      CEP *
                    </label>
                    <input
                      {...register("cep", { required: "Campo obrigatório" })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="00000-000"
                    />
                    {errors.cep && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.cep.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Bairro *
                    </label>
                    <input
                      {...register("bairro", { required: "Campo obrigatório" })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="Nome do bairro"
                    />
                    {errors.bairro && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.bairro.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Cidade *
                    </label>
                    <input
                      {...register("cidade", { required: "Campo obrigatório" })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="Nome da cidade"
                    />
                    {errors.cidade && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.cidade.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Estado *
                    </label>
                    <input
                      {...register("estado", { required: "Campo obrigatório" })}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="Nome do estado"
                    />
                    {errors.estado && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.estado.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Endereço Completo *
                  </label>
                  <input
                    {...register("enderecoCompleto", {
                      required: "Campo obrigatório",
                    })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px]"
                    placeholder="Rua, número, complemento"
                  />
                  {errors.enderecoCompleto && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.enderecoCompleto.message}
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-100 mb-4">
                    Dados Bancários
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Nome do Banco *
                      </label>
                      <input
                        {...register("nomeBanco", {
                          required: "Campo obrigatório",
                        })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                        placeholder="Ex: Banco do Brasil"
                      />
                      {errors.nomeBanco && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.nomeBanco.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Código do Banco *
                      </label>
                      <input
                        {...register("codigoBanco", {
                          required: "Campo obrigatório",
                        })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                        placeholder="Ex: 001"
                      />
                      {errors.codigoBanco && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.codigoBanco.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Agência *
                      </label>
                      <input
                        {...register("agencia", {
                          required: "Campo obrigatório",
                        })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                        placeholder="0000"
                      />
                      {errors.agencia && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.agencia.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Conta *
                      </label>
                      <input
                        {...register("conta", {
                          required: "Campo obrigatório",
                        })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                        placeholder="00000-0"
                      />
                      {errors.conta && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.conta.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300">
                      Chave PIX
                    </label>
                    <input
                      {...register("chavePix")}
                      type="text"
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white placeholder-[#757575] bg-[#41474e] h-[50px] outline-none"
                      placeholder="CPF, e-mail, telefone ou chave aleatória"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-100 mb-4">
                    Modelo de Contrato
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        CPA *
                      </label>
                      <select
                        {...register("modeloContratoCpa", {
                          required: "Campo obrigatório",
                        })}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white bg-[#41474e] h-[50px] outline-none"
                      >
                        <option value="" className="bg-[#41474e] text-white">
                          Selecione
                        </option>
                        {opcoesContratoCpa.map((opcao) => (
                          <option
                            key={opcao}
                            value={opcao}
                            className="bg-[#41474e] text-white"
                          >
                            {opcao}
                          </option>
                        ))}
                      </select>
                      {errors.modeloContratoCpa && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.modeloContratoCpa.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        REV *
                      </label>
                      <select
                        {...register("modeloContratoRev", {
                          required: "Campo obrigatório",
                        })}
                        className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 text-white bg-[#41474e] h-[50px] outline-none"
                      >
                        <option value="" className="bg-[#41474e] text-white">
                          Selecione
                        </option>
                        {opcoesContratoRev.map((opcao) => (
                          <option
                            key={opcao}
                            value={opcao}
                            className="bg-[#41474e] text-white"
                          >
                            {opcao}
                          </option>
                        ))}
                      </select>
                      {errors.modeloContratoRev && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.modeloContratoRev.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-300">
                      Informações Adicionais do Contrato
                    </label>
                    <textarea
                      {...register("informacoesAdicionais")}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc22a] focus:border-transparent transition duration-200 resize-vertical text-white placeholder-[#757575] bg-[#41474e] outline-none"
                      placeholder="Digite informações adicionais sobre o contrato..."
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={voltarEtapa}
                    className="px-8 py-3 bg-gray-600 text-gray-200 font-semibold rounded-lg hover:bg-gray-500 transition duration-200 outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className={`px-8 py-3 font-semibold rounded-lg transition duration-200 shadow-lg hover:shadow-xl outline-none focus:ring-2 focus:ring-[#ffc22a] ${
                      isGenerating
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] text-white hover:from-[#ffb800] hover:to-[#ff8500]"
                    }`}
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span>Gerando...</span>
                      </div>
                    ) : (
                      "Continuar"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modal de Templates */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] px-6 py-4">
              <h2 className="text-xl font-bold text-white text-center">
                Documentos para Assinatura
              </h2>
              <p className="text-orange-100 text-center mt-1">
                Revise os documentos antes de assinar
              </p>
            </div>

            <div className="p-6">
              {/* Acordeon */}
              <div className="space-y-4">
                {/* Termos e Condições */}
                <div className="border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setActiveAccordion("termos")}
                    className={`w-full px-6 py-4 text-left font-semibold flex items-center justify-between transition-colors ${
                      activeAccordion === "termos"
                        ? "bg-[#ffc22a] text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    <span>Termos e Condições</span>
                    <span
                      className={`transform transition-transform ${
                        activeAccordion === "termos" ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {activeAccordion === "termos" && (
                    <div className="p-6 bg-white max-h-96 overflow-y-auto">
                      {isLoadingTemplates ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc22a] mr-3"></div>
                          <span className="text-gray-600">
                            Carregando documento...
                          </span>
                        </div>
                      ) : (
                        <div
                          className="max-w-none text-black prose prose-sm"
                          dangerouslySetInnerHTML={{ __html: termosContent }}
                          style={{ color: "black" }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Contrato de Afiliação */}
                <div className="border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setActiveAccordion("contrato")}
                    className={`w-full px-6 py-4 text-left font-semibold flex items-center justify-between transition-colors ${
                      activeAccordion === "contrato"
                        ? "bg-[#ffc22a] text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    <span>Contrato de Afiliação</span>
                    <span
                      className={`transform transition-transform ${
                        activeAccordion === "contrato" ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {activeAccordion === "contrato" && (
                    <div className="p-6 bg-white max-h-96 overflow-y-auto">
                      {isLoadingTemplates ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffc22a] mr-3"></div>
                          <span className="text-gray-600">
                            Carregando documento...
                          </span>
                        </div>
                      ) : (
                        <div
                          className="max-w-none text-black prose prose-sm"
                          dangerouslySetInnerHTML={{ __html: contratoContent }}
                          style={{ color: "black" }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setShowTemplatesModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAcceptTemplates}
                  className="px-6 py-3 bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] text-white font-semibold rounded-lg hover:from-[#ffb800] hover:to-[#ff8500] transition duration-200"
                >
                  Aceitar e Assinar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Assinatura */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] px-6 py-4">
              <h2 className="text-xl font-bold text-white text-center">
                Assinatura Digital
              </h2>
              <p className="text-orange-100 text-center mt-1">
                Assine digitalmente para finalizar o processo
              </p>
            </div>

            <div className="p-6">
              <AssinaturaDigital
                onSignatureChange={handleSignatureChange}
                onConfirmSignature={handleConfirmSignature}
              />

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Loading */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffc22a] mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Gerando Documentos
            </h3>
            <p className="text-gray-600">{loadingMessage}</p>
            <div className="mt-4 text-sm text-gray-500">
              Por favor, aguarde. Não feche esta página.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
