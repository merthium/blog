---
title: "Firewall Nedir, Türleri Nelerdir"
date: 2026-11-11
draft: false
categories: ["Diğer"]
tags: ["writeup"]
description: "Firewall'ları birlikte inceledik."
---
## Bir Şehir Düşünün
Bir şehir düşünün. Bu şehirde binlerce insan yaşıyor, her saniye yüzlerce araç giriş çıkış yapıyor. Kimileri ticaret için geliyor, kimileri yalnızca geçip gidiyor. Ancak şehre gelen herkesin iyi niyetli olduğunu söyleyebilir miyiz?

Bir gün şehir yönetimi, giriş ve çıkışları kontrol etmek amacıyla belirli noktalara güvenlik görevlileri yerleştirmeye karar veriyor. Bu görevlilerin işi oldukça basit:

Gelenlerin kim olduğunu, nereden geldiklerini ve nereye gitmek istediklerini kontrol etmek. Kurallara uyanlar yollarına devam ederken şüpheli görülenler durduruluyor.
Bilgisayar ağlarında da durum pek farklı değil.
İnternete bağlı bir bilgisayar, sürekli olarak farklı adreslerle iletişim kurar. Bu iletişim sırasında sayısız veri paketi ağ üzerinden geçer. Ancak her paketin sistemimize ulaşmasını veya sistemimizden çıkmasını istemeyebiliriz.

## Paket Nedir?
Bir internet araması yaptınız, bir arkadaşınızla yazıştınız veya bir zoom konferansındasınız. Hiç karşı tarafla nasıl iletişim kurabildiğinizi ve arkada nelerin döndüğünü düşünmüş müydünüz?

Biz bu arkadaki veri taşıyıcı kutulara **Paket** diyoruz. Paketler ağ iletişimindeki en temel veri birimlerinden biridir. 7 Adet Paket türü vardır.

Bunlar:
```text
Protokol	OSI Katmanı	Açıklama	                                                Kullanım Alanı
TCP	        L4 (Transport) | Bağlantı odaklı, güvenilir ve sıralı veri iletimi sağlar. SSH, HTTP/1.1, HTTPS (TCP üzerinden)
UDP	        L4 (Transport) | Bağlantısız çalışır. Teslimat ve sıralama garantisi sağlamaz.	DNS, VoIP, çevrim içi oyunlar
ICMP	        L3 (Network)   | Ağ hatalarını bildirir ve bağlantı teşhisinde kullanılır.	Ping, Traceroute
ARP	        L2/L3 arası    | IPv4 adresine karşılık gelen MAC adresini öğrenir.	        Yerel ağ iletişimi
IGMP	        L3 (Network)   | IPv4 multicast grup üyeliklerini yönetir.	                IPTV, multicast yayınlar
IPv4	        L3 (Network)   | 32 bit IP adresleri kullanarak paketlerin yönlendirilmesini sağlar.	İnternet ve yerel ağlar
IPv6	        L3 (Network)   | 128 bit adresleme sağlayan yeni nesil IP protokolüdür.	        Modern internet ağları
Ethernet	L2 (Data Link) | MAC adresleri aracılığıyla yerel ağda çerçevelerin iletilmesini sağlar.	LAN, switch bağlantıları

```
Basitleştirilmiş bir IPv4 Paketi Şu Şekildedir:

```text
+-------------------------------------+
|             IP HEADER               |
|-------------------------------------|
| Source IP:       192.168.1.10       |
| Destination IP:  142.250.185.14     |
| Protocol:        TCP                |
| TTL:             64                 |
+-------------------------------------+
|              PAYLOAD                |
|-------------------------------------|
| TCP Header                          |
| Application Data                    |
+-------------------------------------+
```

## Firewall Nedir?
İşte burada Firewall (Güvenlik Duvarı) devreye girer.
Firewall, ağ trafiğini önceden belirlenmiş kurallara göre denetleyen ve hangi bağlantılara izin verilip hangilerinin engelleneceğine karar veren bir güvenlik mekanizmasıdır.

## Çalışma Prensiblerine Göre Firewall'lar

## Firewall Türleri
#### 1- Packet Filtering Firewall
En temel güvenlik duvarı türlerinden birisidir. Paketlerin kaynak ve hedef ip adreslerini, port numaralarını ve protokollerini kontrol eder. Hızlıdır, fazla kaynak tüketmez. Önceden tanımlanan kurallara göre paketlere izin verir veya engeller. Kurallarla eşleşmeyen paketler ise güvenlik duvarının yapılandırmasına bağlı olarak drop edilebilir ya da reject edilebilir. (Genelde drop tercih edilir, default'ta da drop vardır.)

#### 2- Stateful Inspection Firewall
Stateful Inspection (durum bilgili denetim), modern firewall'ların temel çalışma prensibidir. İsim, "connection state" (bağlantı durumu) takibi yaptığından gelir.

Bir paket ağdan geçtiğinde şu bilgiler kaydedilir:
```text
  Kaynak IP ve port
  Hedef IP ve port
  Protokol (TCP/UDP/ICMP)
  Bağlantının durumu (SYN_SENT, ESTABLISHED, TIME_WAIT vb.)
```
Çalışma adımları şu şekildedir:

Yeni bağlantı gelir ──► Firewall, kural setini (rule set) kontrol eder ──► Pakete izin verilirse durum tablosuna girilir.

Aynı bağlantının devam paketleri geldiğinde sadece bu durum tablosuna bakılır, eğer kaydı varsa direkt geçilir. **(Fast path)**

Bir iç makine bağlantı başlatmadıysa, dışarıdan gelen paketin state table'da karşılığı yoktur ──► düşürülür.

#### 3- Circuit-Level Gateway
OSI Modelinin Session(Oturum) Katmanında çalışan ve iki sistemi birbirine bağlayarak sanal bir devre kuran firewall türüdür. En büyük temsilcisi SOCKS Proxy'dir. Paketlerin içeriğine yani Application Data'ya bakmak yerine bağlantının durumuna bakar ardından tünel/pipe açar. Modern tehtitler için yetersizdir çünkü içerik kontrolü yapmaz. Ayrıca trafik şeffaftır. 

Günümüzde tek başına firewall olarak sayılamayacak kadar zayıflamıştır.

#### 4- Application-Level Gateway
En derin incelemeyi yapan firewall türüdür. OSI modelinin 7. katmanında proxy olarak çalışır. En büyük örneği **Squid (HTTP proxy)**. Ayrıca FTP, SMTP, DNS gibi protokollere özel proxy'ler de bu kategoriye girer.

ALG trafiği sonlandırır, protokolü çözümler, kurallara göre değerlendirir ve gerekiyorsa yeniden oluşturarak hedefe gönderir: 

İstemci ──► ALG Proxy ──► Hedef Sunucu
  (bağlantı 1)   (bağlantı 2, proxy kendi adına)

İstemci asla hedef ile doğrudan konuşmaz, iki ayrı bağlantı kurulur. Proxy bu ikisinin arasında tam yetkili bir tercümandır.

İstemci proxy'e GET http://ornek.com/dosya isteği gönderir
Proxy isteği çözümler:

   - HTTP metodu izinli mi? (GET ✓, POST? CONNECT?)
   - URL kara listede mi? Kategori filtresi (gambling, malware...)
   - Header'lar şüpheli mi? (SQL injection imzaları, aşırı uzun header)
   - İçerik tipi / dosya uzantısı engelli mi?
   - Kullanıcı kimlik doğrulaması gerekli mi?

Proxy kendi adına hedefe bağlanır, isteği gönderir
Gelen cevabı da denetler (virüs taraması, boyut limiti, MIME tipi)

Sonucu istemciye iletir — *gerekiyorsa içeriği değiştirerek* (**ör. reklam engelleme, header temizleme**)

#### 5- Next-Generation Firewall (NGFW)

Stateful firewall şuna bakıyor:
> "Bu bağlantı kural listesindeki porta gidiyor mu?"
Fakat artık internet trafiğinin yaklaşık %95'i 443 (HTTPS) portundan geçiyor. Yani "443 açık" demek, kontrolün bittiği anlamına geliyor. En uç örnek olarak bir C2 aracı 443 portunu istismar ederek firewall'u atlatabilir demek oluyor bu.

NGFW'nin amacı bu sorunları çözmek. Peki NGFW bunu nasıl çözüyor?

Şu üç yeteneği tek cihazda birleştiriyor:

##### **1- Uygulama tanıma (App-ID)**

Port numarasına değil, trafiğin kendisine bakar. İmza veritabanı + davranış analiziyle "bu 443'teki trafik gerçekten tarayıcı trafiği mi, yoksa Tor/WireGuard/kişisel VPN mi?" sorusuna cevap verir. Bu olmadan port bazlı kurallar amaçsızdır.

##### **2- İçerik denetimi (IPS)**

Bağlantı geçerli olsa bile içindeki payload'ı tarar: exploit kalıpları, shellcode, protokol ihlalleri.

##### **3- SSL/TLS inceleme**

443 şifreli olduğu için bunu görebilmek için trafiği çözümler: istemciye kendi sertifikasını sunar, iki ayrı şifreli trafik kurar. Trafiğin NGFW üzerinden geçerken açık metin halinde olması sayesinde içeriği inceleyebilir, sonra yeniden şifreleyip karşı tarafa iletir. Bu olmadan ilk iki madde şifreli trafikte çalışmaz.

*NGFW, bilerek ve kurumsal CA sertifikasıyla yapılan meşru bir MITM(Man In The Middle)'dır.*

## Konuma Göre Firewall'lar

## Firewall Türleri

#### 1- Host-Based Firewall
Ağ cihazında değil, işletim sisteminde çalışan firewall'dur. Trafiği ağın bir ucunda değil, paketin vardığı makinenin içinde filtreler. En büyük örnekleri: Windows Defender Firewall, iptables/nftables (Linux), macOS Application Firewall, ZoneAlarm.
Çalışma şekli:

Gelen paket, ağ kartından(ethernet kartı) çekilir  ──► Çekirdekteki firewall kural setine uğrar ──► Kurala uyan, işlem düzeyinde kontrolden geçer ──► Uygunsa uygulamaya teslim edilir, değilse düşürülür

Ne zaman işe yarar?
- Seyahat eden laptop / uzak çalışan: Korumalı kurumsal ağın dışındayken bile koruma devam eder
- Şüpheli yazılım containment: Bir uygulamaya ağ erişimini tamamen kapatabilirsin (sandbox)
- Sunucu sertleştirme (hardening): Web sunucusunda "sadece 80, 443 açık, her şey kapalı" demek
- Sıfır-gün saldırılarında ikinci halka: Çevre firewall'u aşan trafik makineye ulaşınca tekrar filtrelenir

Fazla makinede kural tutarlılığı sağlamak için MDM/GPO gibi araçlar gerekir.

#### 2- Network-Based Firewall
Trafiği tek bir noktada, ağın kendisinde filtreleyen firewall'dur. Genellikle iki ağın birleşim noktasında bulunur. Tüm trafik bu tek cihazdan geçmek zorundadır, o da kurallara göre geçirir veya keser.

Örnekler: Palo Alto, FortiGate, Cisco ASA, Check Point (Stateful inspection, NGFW hepsi bu kategoridedir.)

**Network-based firewall çevre savunmasının omurgasıdır. Trafiği tek noktadan toplar, merkezi kural uygular, loglar. Host-based firewall ise onun yapamadığını tamamlar.**

#### 3- Cloud Firewall
Bu firewall türü kendi içerisinde ikiye ayrılıyor:

2- Cloud-native (hizmet)

Bulut sağlayıcının kendi sunduğu, altyapısına gömülü firewall:

   - AWS Security Groups (en temel hali — instance bazlı stateful filtreleme)
   - AWS Network Firewall / Azure Firewall (tam NGFW yetenekleri: IPS, uygulama filtreleme)
   - GCP Cloud Firewall
API ile kuralları tanımlanır. Fiziksel cihaz ve bakım derdi yoktur.

2- Sanal cihaz (virtual appliance)

Palo Alto, FortiGate gibi üreticilerin firewall'unun sanal makine (VM) hali:
   - Kendi sanal makine olarak çalışır
   - Trafiği kendine yönlendirerek incelemesi gerekir (routing ile)

Cloud-native ile karşılaştırıldığında daha fazla kontrol ama daha fazla yönetim yükü ister.

#### Neden Klasik Firewall Buluta Uymuyor?
Klasik firewall veri merkezinden buluta konulamaz çünkü:
- Bulutta perimeter yok: trafik sabit bir kapıdan geçmiyor; kaynaklar dinamik olarak doğup ölüyor, IP'ler sürekli değişiyor.
- Auto-scaling: Fiziksel bir cihaz trafiğe göre boyutunu artıramaz.
- Multi-cloud / hybrid: Trafiğin bir kısmı AWS'de, bir kısmı Azure'de, bir kısmı şirket içinde bulunur.

**Okuduğunuz için teşekkürler :)**