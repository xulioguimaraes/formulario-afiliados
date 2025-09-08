// Utilitários para processar assinatura digital

export function processSignatureForDocument(signatureBase64: string | null) {
  if (!signatureBase64) {
    return "";
  }

  // Remover o prefixo 'data:image/png;base64,' se presente
  const base64Content = signatureBase64.includes(',') 
    ? signatureBase64.split(',')[1] 
    : signatureBase64;

  // Converter base64 para buffer
  const buffer = Buffer.from(base64Content, 'base64');

  return {
    width: 6, // Largura em cm
    height: 2, // Altura em cm
    data: buffer,
    extension: '.png',
  };
}

export function createSignatureImageElement(signatureBase64: string | null) {
  if (!signatureBase64) {
    return "";
  }

  // Remover o prefixo 'data:image/png;base64,' se presente
  const base64Content = signatureBase64.includes(',') 
    ? signatureBase64.split(',')[1] 
    : signatureBase64;

  // Criar elemento de imagem para inserção direta
  return {
    _type: 'image',
    _value: base64Content,
    _width: 200,
    _height: 80
  };
}
