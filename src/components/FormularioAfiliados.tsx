"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { createReport } from "docx-templates";

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

  const gerarContratoDocx = async (data: FormData) => {
    try {
      // Buscar o template .docx
      const response = await fetch("/templates/contrato_template.docx");

      if (!response.ok) {
        throw new Error(
          "Template não encontrado. Certifique-se de que o arquivo contrato_template.docx está na pasta public/templates/"
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
      };

      // Gerar o documento preenchido
      const report = await createReport({
        template: new Uint8Array(templateBuffer),
        data: dadosContrato,
        cmdDelimiter: ["{", "}"], // Usar chaves para os placeholders
      });

      // Criar blob e fazer download
      const blob = new Blob([report as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contrato_afiliado_${data.primeiroNome}_${
        data.sobrenome
      }_${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("Contrato gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      alert("Erro ao gerar contrato. Verifique se o template está disponível.");
    }
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log("Dados do formulário:", data);
    gerarContratoDocx(data);
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
                    className="px-8 py-3 bg-gradient-to-b from-[#ffc22a] to-[#ff9d00] text-white font-semibold rounded-lg hover:from-[#ffb800] hover:to-[#ff8500] transition duration-200 shadow-lg hover:shadow-xl outline-none focus:ring-2 focus:ring-[#ffc22a]"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
