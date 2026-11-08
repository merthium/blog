---
title: "Docker Nedir Podman ile Farkı Nedir"
date: 2026-11-08
draft: false
categories: ["Diğer"]
tags: ["linux","virtualization"]
---

## Sanallaştırma Nedir?
Sanallaştırma tek bir bilgisayarın kaynaklarını kullanarak birden fazla sanal bilgisayar veya sanal teknoloji çalıştırma biçimidir.

Bu yazıda sanallaştırmanın 4 farklı türünü ele alacağız.

## Sanallaştırma Türleri
#### 1- Tam Sanallaştırma
Komple işletim sisteminin sanal bir makinede çalıştırılması işlemidir. KVM ve VirtualBox programları en popüler tam sanallaştırma yazılımlarıdır. Bilgisayarınızın özellikleri dahilinde sanal makinenize ram, depolama alanı vb özellikler tahsis edebilirsiniz.
#### 2- Ağ Sanallaştırma
Sanal ağların, bunlara bağlı olarak switch'lerin ve routerların oluşturulması işlemidir. Sanal ağların fiziksel ağ altyapısından mantıksal olarak ayrılmasını da kapsar. Program olarak Open vSwitch örnek verilebilir.
#### 3- Depolama Sanallaştırma
Depolama kaynaklarını mantıksal olarak birleştirir veya ayırır. ZFS, LVM yazılımları bunlara örnek verilebilir. (ZFS Aynı zamanda bir dosya sistemidir. Checksum ile veri bütünlüğü denetimi sağlayabilir)
#### 4- Konteyner Sanallaştırma (Bu yazıda ele alacağımız konu)
Aynı çekirdeği paylaşan izole ortamların oluşturulması hususundaki teknolojinin adıdır. Örneğin bir program yazdınız ve sizin bilgisayarınızda çalıştı fakat bu programın gereksinimleri her bilgisayarda olmayabilir ya da sürüm farkı olabilir. Bu konuda Docker, Podman, LXC gibi yazılımlar bize yardımcı olur. Temel prensibi yapılan yazılım ve gereksinimlerinin 'image' adını verdiğimiz taşınabilir paketlere dönüştürülmesidir. Bu image'lar kullanılarak 'Konteyner' adını verdiğimiz izole çalışma ortamları oluşturulur. Image'lar uzaktan indirilebilir ve uygun bir Konteyner ortamında doğrudan çalıştırılıp programımızın test edilmesini sağlar. Bu sebeple Sistem Yöneticileri ve Yazılım Geliştiriciler için son derece önemli bir teknolojidir.

## Docker ve Podman'ın Farkı Nedir?
Docker ve Podman aynı işleri yapsalar da mimarileri ve güvenlik yaklaşımları farklıdır. Docker daemon ile çalışır  yani arkada çalışan bir dockerd servisi gereklidir bu yüzden daha çok kaynak tüketir. Podman ise daemonless'tir bu yüzden daha hafiftir. Docker root yetkisi ile çalışmaktadır, Podman ise varsayılan olarak rootless kullanımı benimsemektedir. Pod desteğiyse Podman'da yerleşik olarak gelirken Docker'da bulunmaz. Ayrıca Docker oldukça yaygınken Podman biraz daha niştir.

## Hangisi Seçilmeli?

CI/CD, Yaygın endüstri araçları, yazılım geliştirme hedefleniyorsa **Docker** seçilmeli. Fakat Linux Sistem Yönetimi, minimal mimari daha ağırlıklı tercih ediliyorsa **Podman** güzel bir alternatif.