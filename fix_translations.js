import fs from 'fs';
import path from 'path';

function fixFile(filePath, lang) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find missing keys from before
  const missingKeys = [
    'group',                'save_success',        'save_failed',
    'global_speed',         'dl_limit_enabled',    'ul_limit_enabled',
    'conn_limits',          'config_dir',          'group_save_success',
    'group_save_failed',    'group_delete_failed', 'update_failed',
    'testing',              'port_open',           'port_closed',
    'test_failed',          'bandwidth_groups',    'blocklist',
    'script',               'advanced',            'title',
    'incomplete_enabled',   'incomplete_dir_hint', 'add_behavior',
    'start_added',          'rename_partial',      'trash_torrent',
    'alt_speed_time',       'start_time',          'end_time',
    'days',                 'groups_hint',         'group_add',
    'no_groups',            'group_edit',          'group_delete',
    'group_download_limit', 'group_no_limit',      'group_upload_limit',
    'group_honors_session', 'group_add_title',     'group_name',
    'listen_port',          'random_port',         'port_forwarding',
    'protocols',            'dht',                 'pex',
    'lpd',                  'utp',                 'enc_required',
    'enc_preferred',        'enc_tolerated',       'security',
    'anti_brute',           'transport_pref',      'pref_transports',
    'pref_utp_tcp',         'pref_tcp_utp',        'pref_utp',
    'pref_tcp',             'global_peer_limit',   'enabled',
    'dl_queue',             'max_dl',              'seed_queue',
    'max_seed',             'stalled_detection',   'stalled_timeout',
    'blocklist_url',        'rules_count',         'update_blocklist',
    'test_port',            'ip_protocol',         'ip_protocol_auto',
    'rpc_semver',           'rpc_min_version',     'session_id',
    'script_added',         'script_path',         'script_done',
    'script_done_seeding',  'cache_size',          'disabled'
  ];

  // Try to find if they exist elsewhere in the file to borrow the translation
  const getTranslation = (key) => {
    const regex = new RegExp(`"${key}":\\s*"([^"]+)"`);
    const match = content.match(regex);
    if (match) return match[1];
    
    // fallbacks
    if (lang === 'zh') {
      if (key === 'download_limit') return '下载限速';
      if (key === 'dl_limit_enabled') return '启用下载限速';
      if (key === 'ul_limit_enabled') return '启用上传限速';
      if (key === 'upload_limit') return '上传限速';
      if (key === 'testing') return '测试中...';
      if (key === 'port_open') return '端口开放';
      if (key === 'port_closed') return '端口关闭';
      if (key === 'test_failed') return '测试失败';
      if (key === 'bandwidth_groups') return '带宽组';
      if (key === 'blocklist') return '黑名单';
      if (key === 'script') return '脚本';
      if (key === 'advanced') return '高级';
      if (key === 'incomplete_enabled') return '追加 .part 后缀';
      if (key === 'start_added') return '添加后立即开始';
      if (key === 'rename_partial') return '重命名未完成的文件';
      if (key === 'trash_torrent') return '删除原始种子文件';
      if (key === 'alt_speed_time') return '计划任务';
      if (key === 'start_time') return '开始时间';
      if (key === 'end_time') return '结束时间';
      if (key === 'days') return '天数';
      if (key === 'group_add') return '添加分组';
      if (key === 'no_groups') return '暂无分组';
      if (key === 'group_edit') return '编辑分组';
      if (key === 'group_delete') return '删除分组';
      if (key === 'port_forwarding') return '端口转发';
      if (key === 'dht') return 'DHT';
      if (key === 'pex') return 'PEX';
      if (key === 'lpd') return 'LPD';
      if (key === 'utp') return 'uTP';
      if (key === 'enc_required') return '要求';
      if (key === 'enc_preferred') return '优先';
      if (key === 'enc_tolerated') return '允许';
      if (key === 'security') return '安全';
      if (key === 'anti_brute') return '防暴力破解';
      if (key === 'global_peer_limit') return '全局连接数限制';
      if (key === 'enabled') return '已启用';
      if (key === 'disabled') return '已禁用';
      if (key === 'test_port') return '测试端口';
      if (key === 'save_success') return '保存成功';
      if (key === 'save_failed') return '保存失败';
      if (key === 'update_failed') return '更新失败';
      if (key === 'update_blocklist') return '更新黑名单';
      if (key === 'rpc_semver') return 'RPC 版本';
    } else {
      // English fallbacks
      const words = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return words;
    }
    return key;
  };

  let newEntries = missingKeys.map(k => `      "${k}": "${getTranslation(k)}",`).join('\n');
  
  // Inject new entries into settings block
  const settingsMatch = content.match(/"settings":\s*\{/);
  if (settingsMatch) {
    const insertPos = settingsMatch.index + settingsMatch[0].length;
    const newContent = content.slice(0, insertPos) + '\n' + newEntries + content.slice(insertPos);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

fixFile(path.join(process.cwd(), 'src/utils/i18n/zh-CN.ts'), 'zh');
fixFile(path.join(process.cwd(), 'src/utils/i18n/en.ts'), 'en');
