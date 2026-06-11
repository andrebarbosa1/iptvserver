import React from "react";
import { HelpCircle, Star, Shield, Link, RefreshCcw, Settings, Heart, Cpu } from "lucide-react";

export default function ManualGuia() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight" id="guide-title">Manual de IPTV & Geração M3U</h2>
        <p className="text-slate-400 text-sm">Respostas para as suas dúvidas sobre arquitetura IPTV, administração de clientes e infraestrutura de servidores.</p>
      </div>

      {/* Answer Section 1 */}
      <div className="bg-slate-850 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" /> 1. O que um Sistema de Administração IPTV deve conter?
        </h3>
        
        <p className="text-sm text-slate-350 leading-relaxed">
          Um painel de IPTV profissional (como o que construímos aqui) serve para gerenciar e monetizar transmissões de TV e mídia sob demanda. Ele funciona como uma camada inteligente entre os streams brutos de vídeo e os clientes finais. Os recursos fundamentais incluem:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs select-none">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
            <h4 className="font-bold text-sky-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Controle de Assinaturas (CRM)
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Gerenciamento de datas de expiração automática, categorização de clientes (Mensal, Anual, Teste Grátis) e envio de notificações para lembrete de renovação de pagamentos.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
              <Link className="w-4 h-4" /> Segurança por Token Único
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              A URL do cliente contêm um token privado (como <code className="text-amber-500 bg-black/45 px-1 py-0.2 rounded font-mono">/playlist/token123</code>). Se o token for inválido ou o cliente estiver expirado, o servidor cancela o feed ou substitui por um vídeo de cobrança.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
            <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Settings className="w-4 h-4" /> Filtros e Grade Customizada
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Separação de canais por categorias (Esportes, Filmes, Notícias). Permite vender pacotes menores ou remover categorias pesadas (como 4K ou Conteúdos Adultos) dependendo do que o cliente comprou.
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
            <h4 className="font-bold text-purple-400 flex items-center gap-1.5">
              <RefreshCcw className="w-4 h-4" /> Importador Inteligente
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Ferramentas de entrada rápida de dados, como o parseador M3U que mapeia milhares de links automaticamente usando expressões regulares, liberando o administrador do trabalho manual.
            </p>
          </div>
        </div>
      </div>

      {/* Answer Section 2 */}
      <div className="bg-slate-850 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" /> 2. O que é e Como criar um Sistema de Lista M3U?
        </h3>
        
        <div className="space-y-3.5 text-sm text-slate-300 leading-relaxed">
          <p>
            O formato <strong>M3U (e M3U8)</strong> é um arquivo de texto simples contendo links estruturados de mídia.
            Para montar um sistema automático que gera essas listas em escala, o ciclo funciona desta maneira:
          </p>

          <ol className="list-decimal pl-5 space-y-3 text-xs text-slate-400">
            <li>
              <strong className="text-slate-200">Armazenamento Base:</strong> 
              Guardar os canais (nome, url do .m3u8 ou .mp4, grupo) em um banco de dados relacional ou arquivo estruturado (como o <code className="text-sky-405 font-mono bg-black/40 px-1 rounded">iptv_data.json</code> local do nosso painel!).
            </li>
            <li>
              <strong className="text-slate-200">Servidor Dinâmico:</strong> 
              Criar uma rota HTTP dedicada no backend que escuta os tokens dos clientes de forma dinâmica.
            </li>
            <li>
              <strong className="text-slate-200">Validação e Processamento:</strong>
              No momento da requisição, o servidor analisa a validade do cliente. Se estiver tudo OK, o servidor monta o cabeçalho <code className="text-sky-450 font-mono">#EXTM3U</code> e concatena os canais correspondentes aos pacotes ativos daquele usuário.
            </li>
            <li>
              <strong className="text-slate-200">Geração de Resposta de Arquivo:</strong>
              O servidor responde à requisição de rede definindo o cabeçalho <code className="text-emerald-400 font-mono">Content-Type: application/x-mpegurl</code> descrevendo que o arquivo é uma playlist. Os players de IPTV leem esse texto e mostram as categorias para o usuário.
            </li>
          </ol>

          <div className="bg-slate-900 p-4 border border-slate-800 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wide">Exemplo de Estrutura de Retorno Geral M3U</span>
            <pre className="font-mono text-xs text-sky-400 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
{`#EXTM3U
#EXTINF:-1 tvg-id="espn1" tvg-name="ESPN HD" tvg-logo="https://dominio.com/logos/espn.png" group-title="Esportes",ESPN Brasil
http://streaming-servidor.xyz/esportes/espnhd.m3u8

#EXTINF:-1 tvg-id="matrix" tvg-name="Matrix VOD Filme" tvg-logo="https://dominio.com/logos/matrix.jpg" group-title="Filmes",Matrix Resurrections (Filme)
http://streaming-servidor.xyz/filmes/matrix.mp4`}
            </pre>
          </div>
        </div>
      </div>

      {/* Answer Section 3 */}
      <div className="bg-slate-850 p-6 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" /> Dicas de Ouro para sua Operação de IPTV
        </h3>
        
        <ul className="list-disc pl-5 space-y-2.5 text-xs text-slate-400 leading-relaxed">
          <li>
            <strong className="text-slate-300">CDN & Largura de Banda:</strong> Servir fluxos de vídeo consome muita rede. Sempre armazene filmes (VODs) em servidores com banda larga ilimitada ou CDN (como Cloudflare) para evitar travamentos.
          </li>
          <li>
            <strong className="text-slate-300">Links de Backup:</strong> Mantenha URLs redundantes para os canais principais de sua grade. Se a transmissão principal cair, você atualiza a URL no painel e ela se propaga para as listas dos usuários em tempo real.
          </li>
          <li>
            <strong className="text-slate-300">HLS (.m3u8):</strong> Dê preferência aos formatos baseados em HLS ou TS para canais ao vivo. Eles se adaptam melhor à oscilação da conexão 4G e WiFi dos seus assinantes.
          </li>
        </ul>
      </div>
    </div>
  );
}
