#!/usr/bin/env python3
import sys
import struct
import ipaddress

sys.path.insert(0, '/tmp/mmdb_lib')
import maxminddb

MMDB_PATH = 'assets/geoip/GeoLite2-Country.mmdb'
OUTPUT_PATH = 'assets/geoip/geoip.bin'

def ip_to_bytes(ip_int, version):
    if version == 4:
        return struct.pack('>I', ip_int)
    else:
        return ip_int.to_bytes(16, 'big')

def main():
    print('Opening MMDB database...')
    reader = maxminddb.open_database(MMDB_PATH)
    
    v4_ranges = []
    v6_ranges = []
    country_names = {}
    country_set = set()
    
    print('Extracting IP ranges...')
    
    for subnet, record in reader:
        try:
            network = ipaddress.ip_network(subnet, strict=False)
        except ValueError:
            continue
        
        if not record:
            continue
        
        country = record.get('country') or record.get('registered_country')
        if not country:
            continent = record.get('continent')
            if continent:
                country = {'iso_code': continent.get('code', ''), 'names': continent.get('names', {})}
        
        if not country:
            continue
        
        code = country.get('iso_code', '')
        if not code:
            continue
        
        names = country.get('names', {})
        name = names.get('zh-CN', '') or names.get('en', '') or code
        
        country_set.add(code)
        if code not in country_names:
            country_names[code] = name
        
        start_ip = int(network.network_address)
        end_ip = int(network.broadcast_address)
        
        if network.version == 4:
            v4_ranges.append((start_ip, end_ip, code))
        else:
            v6_ranges.append((start_ip, end_ip, code))
    
    reader.close()
    
    v4_ranges.sort(key=lambda x: x[0])
    v6_ranges.sort(key=lambda x: x[0])
    
    code_list = sorted(country_set)
    country_index = {code: i for i, code in enumerate(code_list)}
    
    print(f'IPv4 ranges: {len(v4_ranges)}')
    print(f'IPv6 ranges: {len(v6_ranges)}')
    print(f'Total countries: {len(code_list)}')
    
    with open(OUTPUT_PATH, 'wb') as f:
        # Header
        f.write(b'GEOIP1')
        f.write(struct.pack('>I', len(code_list)))
        f.write(struct.pack('>I', len(v4_ranges)))
        f.write(struct.pack('>I', len(v6_ranges)))
        
        # Country table
        for code in code_list:
            code_bytes = code.encode('ascii')[:2].ljust(2, b'\x00')
            name_bytes = country_names[code].encode('utf-8')
            f.write(code_bytes)
            f.write(struct.pack('>H', len(name_bytes)))
            f.write(name_bytes)
        
        # IPv4 ranges: 4 bytes start + 4 bytes end + 2 bytes country index = 10 bytes each
        for start_ip, end_ip, code in v4_ranges:
            idx = country_index[code]
            f.write(struct.pack('>IIH', start_ip, end_ip, idx))
        
        # IPv6 ranges: 16 bytes start + 16 bytes end + 2 bytes country index = 34 bytes each
        for start_ip, end_ip, code in v6_ranges:
            idx = country_index[code]
            f.write(start_ip.to_bytes(16, 'big'))
            f.write(end_ip.to_bytes(16, 'big'))
            f.write(struct.pack('>H', idx))
    
    import os
    size = os.path.getsize(OUTPUT_PATH)
    print(f'Output file: {OUTPUT_PATH} ({size} bytes, {size/1024/1024:.1f} MB)')
    
    print('\nTest IPv4 lookups:')
    test_v4 = ['95.133.241.34', '8.8.8.8', '1.1.1.1', '223.5.5.5', '114.114.114.114']
    for ip_str in test_v4:
        ip_int = int(ipaddress.ip_address(ip_str))
        found = None
        lo, hi = 0, len(v4_ranges) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if v4_ranges[mid][0] <= ip_int <= v4_ranges[mid][1]:
                found = v4_ranges[mid][2]
                break
            elif ip_int < v4_ranges[mid][0]:
                hi = mid - 1
            else:
                lo = mid + 1
        print(f'  {ip_str} -> {found}')
    
    print('\nTest IPv6 lookups:')
    test_v6 = [
        '2001:4860:4860::8888',  # Google DNS
        '2606:4700:4700::1111',  # Cloudflare
        '2400:3200::1',          #阿里DNS
        '2001:dc7::1',           # CNNIC
    ]
    for ip_str in test_v6:
        ip_int = int(ipaddress.ip_address(ip_str))
        found = None
        lo, hi = 0, len(v6_ranges) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if v6_ranges[mid][0] <= ip_int <= v6_ranges[mid][1]:
                found = v6_ranges[mid][2]
                break
            elif ip_int < v6_ranges[mid][0]:
                hi = mid - 1
            else:
                lo = mid + 1
        print(f'  {ip_str} -> {found}')

if __name__ == '__main__':
    main()
