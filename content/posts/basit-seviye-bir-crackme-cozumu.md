---
title: "Basit Seviye Bir Crackme Çözümü"
date: 2026-11-08
draft: false
categories: ["Reversing"]
tags: ["reverse-engineering","crackme"]
---
Bu  yazımızda Radare2 aracını kullanarak basit seviye bir crackme'yi birlikte çözeceğiz. ilk başta aracımızı açtık.

![2026-11-08_03-29.png](/uploads/cec22ab0-2026-11-08_03-29.png)

Bizden ikinci parametreyi yani argv[1]'i istediğini görebiliriz. Yani argc == 2 olmalı. Bunu kafadan söyleyebilirsiniz. Kullandığınız terminal programlarında da eğer bir argüman sayısı hatası alıyorsanız böyle. Bu argc parametresi içerdiği içinidir. Şimdi devam edelim.

![2026-11-08_03-33.png](/uploads/f7fbcce3-2026-11-08_03-33.png)

Gördüğünüz gibi -A parametresi, Radare2'ye programı analiz etmemizi söyler ve fonksiyonların konumlarını ve adlarını arar.

Şimdi çıkan sonuca dönelim. Bütün programlar başladığında ilk başta main fonksiyonu çalışır. Bu yüzden Main fonksiyonumuzun içine şu şekilde girebiliriz
$ `s main`

![2026-11-08_03-36.png](/uploads/2ac029ff-2026-11-08_03-36.png)

Evet bu şuanda main fonksiyonunun içerisinde olduğumuzu gösteriyor. Şimdi `pdf` komudu ile instruction'ları gözlemleyebiliriz.

![2026-11-08_03-38.png](/uploads/687ea53c-2026-11-08_03-38.png)

Burayı anlamanız için assembly intel instruction komutlarından bir kaçını bilmeniz gerekmekte. Bunlardan bazıları:


![2026-11-08_03-40.png](/uploads/93bb254d-2026-11-08_03-40.png)

Bunları kafamıza yerleştirdiğimize göre devam edebiliriz.

![2026-11-08_03-53.png](/uploads/3c96d0de-2026-11-08_03-53.png)


![2026-11-08_04-23.png](/uploads/a4ef3ca3-2026-11-08_04-23.png)

**encoded[0] = 0x50 = 80**

**0 + 35 = 35**

**80 XOR 35 = 115**

**ascii 115 = s**

Böyle gittiğimizde `stack_trace_7` şifresini elde ediyoruz.


![2026-11-08_04-24.png](/uploads/98beeca5-2026-11-08_04-24.png)

