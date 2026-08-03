import { PlaylistItem } from '../types';

export function parseM3UContent(rawText: string): PlaylistItem[] {
  const lines = rawText.split(/\r?\n/);
  const items: PlaylistItem[] = [];

  let currentItem: Partial<PlaylistItem> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      currentItem = {};
      
      // Extract tvg-logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      if (logoMatch) currentItem.logoUrl = logoMatch[1];

      // Extract tvg-name
      const nameMatch = line.match(/tvg-name="([^"]+)"/i);
      if (nameMatch) currentItem.tvgName = nameMatch[1];

      // Extract tvg-id
      const idMatch = line.match(/tvg-id="([^"]+)"/i);
      if (idMatch) currentItem.tvgId = idMatch[1];

      // Extract group-title
      const groupMatch = line.match(/group-title="([^"]+)"/i);
      if (groupMatch) {
        currentItem.groupTitle = groupMatch[1];
      } else {
        currentItem.groupTitle = 'Geral';
      }

      // Extract Title (after the comma)
      const commaIndex = line.indexOf(',');
      if (commaIndex !== -1) {
        currentItem.title = line.substring(commaIndex + 1).trim();
      } else {
        currentItem.title = currentItem.tvgName || 'Canal Desconhecido';
      }

      // Determine Category
      const lowerGroup = (currentItem.groupTitle || '').toLowerCase();
      const lowerTitle = (currentItem.title || '').toLowerCase();

      if (lowerGroup.includes('filme') || lowerGroup.includes('vod') || lowerGroup.includes('movie') || lowerTitle.includes('4k ultra')) {
        currentItem.category = 'movie';
      } else if (lowerGroup.includes('série') || lowerGroup.includes('series') || lowerGroup.includes('temporada')) {
        currentItem.category = 'series';
      } else {
        currentItem.category = 'live';
      }

    } else if (line.startsWith('#EXTGRP:')) {
      currentItem.groupTitle = line.replace('#EXTGRP:', '').trim();
    } else if (line && !line.startsWith('#')) {
      if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://')) {
        currentItem.streamUrl = line;
        currentItem.id = `m3u-${items.length + 1}-${Date.now().toString(36)}`;
        
        if (currentItem.title && currentItem.streamUrl) {
          items.push({
            id: currentItem.id,
            title: currentItem.title,
            groupTitle: currentItem.groupTitle || 'Geral',
            streamUrl: currentItem.streamUrl,
            logoUrl: currentItem.logoUrl,
            category: currentItem.category || 'live',
            tvgId: currentItem.tvgId,
            tvgName: currentItem.tvgName,
            epgProgram: 'Programação ao vivo'
          });
        }
        currentItem = {};
      }
    }
  }

  return items;
}

export function generateM3UContent(items: PlaylistItem[]): string {
  let output = '#EXTM3U x-tvg-url="http://play.streamflow.com/epg.xml.gz"\n\n';
  
  items.forEach(item => {
    const logo = item.logoUrl ? ` tvg-logo="${item.logoUrl}"` : '';
    const name = item.tvgName || item.title;
    const group = item.groupTitle || 'Geral';
    
    output += `#EXTINF:-1 tvg-id="${item.tvgId || ''}" tvg-name="${name}"${logo} group-title="${group}",${item.title}\n`;
    output += `${item.streamUrl}\n\n`;
  });

  return output;
}
