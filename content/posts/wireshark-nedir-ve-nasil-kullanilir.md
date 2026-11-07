---
title: "Wireshark Nedir ve Nasıl Kullanılır?"
date: 2026-11-08
draft: false
categories: ["Network"]
tags: ["writeup","network"]
description: "Wireshark kullanımı hakkında bilgilendirme"
---

## **Wireshark Nedir ve Ne Değildir**
Wireshark, sistem yöneticileri, ağ yöneticileri ve siber güvenlik uzmanları tarafından ağ trafiğini analiz etmek, anomalileri tespit etmek ve bağlantı sorunlarını gidermek amacıyla kullanılan açık kaynaklı bir paket analiz aracıdır.

Günümüzde birçok uygulama TLS gibi şifreleme protokollerini kullandığından, paketlerin uygulama katmanındaki içerikleri doğrudan okunamayabilir. Ancak IP adresleri, port numaraları, TCP bayrakları ve paketlerin iletim sırası gibi bilgiler incelenebilir.

Wireshark, özellikle TCP/IP protokol ailesinin çalışma mantığını anlamak ve ağ iletişimini paket düzeyinde gözlemlemek isteyenler için oldukça faydalı bir araçtır.

> Packets don't lie. *Laura Chappell*

- İlk olarak eğer network temeliniz yoksa bu yazıyı okuduktan sonra network ile ilgili olan yazımı okuyup bu yazıya geri dönmenizi tavsiye ederim.

## Wireshark'ı İndirmek
Eğer Windows veya MacOS kullanıyorsanız [buraya](https://www.wireshark.org/download.html) tıklayarak indirebilirsiniz. Eğer Linux kullanıyorsanız ilgili paket yöneticinizden indirmenizi tavsiye ederim.
Örnek (Devuan)

$ `sudo apt-get install -y wireshark wireshark-qt`

## Wireshark Neye Benziyor?
Evet Wireshark'ı indirdiğimize göre bir giriş yapalım.
Başta bizden bir 'interface' seçmemizi istiyor, peki nedir bu interface? Interface bir cihazın ağ ile iletişim kurmasını sağlayan fiziksel veya sanal bağlantı noktasıdır.

![2026-11-08_02-25.png](/uploads/8ec46463-2026-11-08_02-25.png)



## Hangisini seçeceğimizi nereden bileceğiz?

wlan0 / wlp2s0	Wi-Fi üzerinden internete bağlanıyorsan
eth0 / enp3s0	Ethernet kablosunun trafiği incelenecekse                    
lo	localhost (127.0.0.1) trafiğini inceleyecekse seç
tun0	VPN üzerinden geçen trafiği inceleyeceksen seç
docker0	Docker ağ trafiğini inceleyeceksen seç.


---
Ben şimdilik bir şey seçmeyeceğim çünkü yönetici yetkisi ile açmadım. Bunun yerine örnek bir dump inceleyeceğiz.

![2026-11-08_02-42.png](/uploads/8aa470a8-2026-11-08_02-42.png)

Evet. Şimdi görebildiğiniz üzere **Source** yani kaynak ve **Destination** yani Hedef IP adreslerimiz var. Bu tahmin de edilebileceği üzere kullanılan protokolün kaynak ve hedef parametreleri. Bunlara ekstra olarak çok fazla tab daha konulabilir elbette. Fakat biz şimdilik bunlarla yetineceğiz. devamına baktığımızda Protocol, Length ve Info tablarını görmekteyiz.
- **Protocol**: Paketin hangi protokolle ilişkili olduğunu gösterir. Örneğin TCP, UDP, DNS, HTTP veya TLS.
- **Length (Uzunluk)**: Yakalanan paketin bayt (byte) cinsinden toplam uzunluğunu gösterir. Örneğin 74, 74 bayt demektir.
- **Info (Bilgi)**: Paketin içeriğine ve amacına ilişkin kısa bilgiler sunar. Örneğin SYN bağlantı isteğini, SYN, ACK ise bu isteğe verilen yanıtı belirtir.

![2026-11-08_02-47.png](/uploads/d4744063-2026-11-08_02-47.png)

Aşağı tarafa geldiğimizde ise sol taraf bize bilgileri ağ katmanlarına göre gösterirken sağdaki ekran, aynı paketin ham baytlarını hex ve ascii kullanarak gösterir. Burayı daha iyi anlamak için network bilgisi şarttır. Örneğin **Ethernet II** katmanımızda kaynak ve hedef MAC Adresleri bulunur. Bu yapı ayrıca Encapsulation mantığını görmek açısından faydalıdır.

1. Frame: Paketin toplam boyutu ve yakalanma bilgileri.
2. Ethernet II: Kaynak ve hedef MAC adresleri.
3. IPv4: Kaynak ve hedef IP adresleri.
4. UDP: Kaynak ve hedef port numaraları.
5. DNS: Paketin taşıdığı DNS sorgusu.