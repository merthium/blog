---
title: "Orta Seviye Crackme"
date: 2026-11-09
draft: false
categories: ["Reversing"]
tags: ["reverse-engineering","crackme"]
description: "Bu yazımızda orta seviye, fonksiyonları stripped olan bir programı radare2 ile çözdük."
---
Önceki yazımızda nispeten basit sayılabilecek bir crackme çözmüştük. Bu sefer orta seviye, biraz daha gerçekçi bir crackme çözeceğiz.

İyi okumalar dilerim.

`$ chmod +x crackme`    

`$ ./crackme`

![2026-11-09_15-37.png](/uploads/0234d9e0-2026-11-09_15-37.png)

![2026-11-09_15-38.png](/uploads/75b9cb16-2026-11-09_15-38.png)

![2026-11-09_15-42.png](/uploads/5e196f11-2026-11-09_15-42.png)


> Stripped
Stripped demek bizim fonksiyonlarımızın isimleri derleyici tarafından gizlendi demek oluyor. Yani Main fonksiyonunu, şifreleyici fonksiyonları vb. tespit etmek için akışı takip etmeliyiz.

```text
[0x00001080]> afl
0x00001010    1      6 sym.imp.puts
0x00001020    1      6 sym.imp.strlen
0x00001030    1      6 sym.imp.strcspn
0x00001040    1      6 sym.imp.fgets
0x00001050    1      6 sym.imp.fflush
0x00001060    1      6 sym.imp.__printf_chk
0x00001070    1      6 sym.imp.exit
0x00001080    1     18 entry0
0x000011a6   10    210 fcn.000011a6
0x00001140   13    102 fcn.00001140
0x00001093    5     53 fcn.00001093
0x000010c8    5     76 fcn.000010c8
0x00001114    3     44 fcn.00001114
```
Bizim olayımız şimdilik entry0 fonksiyonunda. Main'i bulmak için Main'i çağıran fonksiyona gitmeliyiz.

```text
[0x00001080]> pdf
            ;-- section..text:
            ;-- rip:
┌ 18: entry0 (); // noreturn
│           0x00001080      31ed           xor ebp, ebp                ; [11] -r-x section size 504 named .text
│           0x00001082      4883e4f0       and rsp, 0xfffffffffffffff0
│           0x00001086      e81b010000     call fcn.000011a6
│           0x0000108b      89c7           mov edi, eax                ; int status
└           0x0000108d      e8deffffff     call sym.imp.exit           ; void exit(int status)
```
```text
xor ebp, ebp                    ; bir register kendisi ile xor'lanırsa 0 olur. ebp = 0
and rsp, 0xfffffffffffffff0     ; rsp'yi 16 byte'a hizala
call fcn.000011a6               ; asıl program (main)
mov edi, eax                    ; dönüş değeri → exit'in 1. argümanı
call sym.imp.exit 
```
`$ s fcn.00011a6`  
  
  
`$ pdf`

```text
┌ 210: fcn.000011a6 ();
│ afv: vars(2:sp[0x3e..0x43])
│           0x000011a6      53             push rbx
│           0x000011a7      4883ec40       sub rsp, 0x40
│           0x000011ab      488d354e0e..   lea rsi, str.Serial:        ; segment.LOAD2
│                                                                      ; 0x2000 ; "Serial: "
│           0x000011b2      bf02000000     mov edi, 2
│           0x000011b7      b800000000     mov eax, 0
│           0x000011bc      e89ffeffff     call sym.imp.__printf_chk
│           0x000011c1      488b3d382e..   mov rdi, qword [obj.stdout] ; [0x4000:8]=0 ; FILE *stream
│           0x000011c8      e883feffff     call sym.imp.fflush         ; int fflush(FILE *stream)
│           0x000011cd      4889e7         mov rdi, rsp                ; char *s
│           0x000011d0      488b15392e..   mov rdx, qword [obj.stdin]  ; [0x4010:8]=0 ; FILE *stream
│           0x000011d7      be40000000     mov esi, 0x40               ; elf_phdr ; int size
│           0x000011dc      e85ffeffff     call sym.imp.fgets          ; char *fgets(char *s, int size, FILE *stream)
│           0x000011e1      4885c0         test rax, rax
│       ┌─< 0x000011e4      0f8487000000   je 0x1271
│       │   0x000011ea      4889e3         mov rbx, rsp
│       │   0x000011ed      488d35150e..   lea rsi, [0x00002009]       ; "\r\n" ; const char *s2
│       │   0x000011f4      4889df         mov rdi, rbx                ; const char *s1
│       │   0x000011f7      e834feffff     call sym.imp.strcspn        ; size_t strcspn(const char *s1, const char *s2)
│       │   0x000011fc      c6040400       mov byte [rsp + rax], 0
│       │   0x00001200      4889df         mov rdi, rbx                ; int64_t arg1
│       │   0x00001203      e838ffffff     call fcn.00001140
│       │   0x00001208      85c0           test eax, eax
│      ┌──< 0x0000120a      743f           je 0x124b
│      ││   0x0000120c      4889e7         mov rdi, rsp                ; int64_t arg1
│      ││   0x0000120f      e87ffeffff     call fcn.00001093
│      ││   0x00001214      85c0           test eax, eax
│     ┌───< 0x00001216      741c           je 0x1234
│     │││   0x00001218      488d7c2405     lea rdi, [var_5h]           ; int64_t arg1
│     │││   0x0000121d      e8a6feffff     call fcn.000010c8
│     │││   0x00001222      85c0           test eax, eax
│    ┌────< 0x00001224      740e           je 0x1234
│    ││││   0x00001226      488d7c240a     lea rdi, [var_ah]           ; uint32_t arg1
│    ││││   0x0000122b      e8e4feffff     call fcn.00001114
│    ││││   0x00001230      85c0           test eax, eax
│   ┌─────< 0x00001232      752a           jne 0x125e
│   │││││   ; CODE XREFS from fcn.000011a6 @ 0x1216(x), 0x1224(x)
│   │└└───> 0x00001234      488d3df10d..   lea rdi, str.Access_denied. ; 0x202c ; "Access denied." ; const char *s
│   │  ││   0x0000123b      e8d0fdffff     call sym.imp.puts           ; int puts(const char *s)
│   │  ││   0x00001240      b801000000     mov eax, 1
│   │  ││   ; CODE XREFS from fcn.000011a6 @ 0x125c(x), 0x126f(x), 0x1276(x)
│  ┌─┌┌───> 0x00001245      4883c440       add rsp, 0x40
│  ╎│╎╎││   0x00001249      5b             pop rbx
│  ╎│╎╎││   0x0000124a      c3             ret
│  ╎│╎╎││   ; CODE XREF from fcn.000011a6 @ 0x120a(x)
│  ╎│╎╎└──> 0x0000124b      488d3dba0d..   lea rdi, str.Invalid_format. ; 0x200c ; "Invalid format." ; const char *s
│  ╎│╎╎ │   0x00001252      e8b9fdffff     call sym.imp.puts           ; int puts(const char *s)
│  ╎│╎╎ │   0x00001257      b801000000     mov eax, 1
│  └──────< 0x0000125c      ebe7           jmp 0x1245
│   │╎╎ │   ; CODE XREF from fcn.000011a6 @ 0x1232(x)
│   └─────> 0x0000125e      488d3db70d..   lea rdi, str.Access_granted. ; 0x201c ; "Access granted." ; const char *s
│    ╎╎ │   0x00001265      e8a6fdffff     call sym.imp.puts           ; int puts(const char *s)
│    ╎╎ │   0x0000126a      b800000000     mov eax, 0
│    └────< 0x0000126f      ebd4           jmp 0x1245
│     ╎ │   ; CODE XREF from fcn.000011a6 @ 0x11e4(x)
│     ╎ └─> 0x00001271      b801000000     mov eax, 1
└     └───< 0x00001276      ebcd           jmp 0x1245
```

## Adım adım ilerleyelim.

```text
push rbx
sub rsp, 0x40
```
Bu klasik fonksiyon prolog'u. Bir alt satırında gerçekleşen işlem fgets()'e verilen adres. Fark ettiyseniz o adres de RSP pointer'ımızdan başlıyor.

```text
printf(fmt, ...)             // normal
__printf_chk(flag, fmt, ...) // fortify'lı, iki adet parametre alıyor
```

## Calling Convention'u hatırlayalım.
Argüman sırası şu şekildeydi:

`rdi -> rsi -> rdx -> rcx...`

maalesef __printf_chk'de durumlar biraz daha farklı.
```text
register	normal printf	__printf_chk
  rdi	        format string	flag (edi = 2)
  rsi	        1. argüman	format string ("Serial: ")
  rdx	        2. argüman	1. argüman
```
__printf_chk, __sprintf_chk, __fprintf_chk gibi _chk ekli fonksiyonlarda argümanlar bir register kaymış olur. Bunu aklımızda bulundurmalıyız.
 
## Peki şuanda ne biliyoruz?

```text
fcn.000011a6 -> Büyük ihtimalle main fonksiyonu.
fcn.00001140 -> Başarısız olursa invalid format yazdırıyor.
fcn.00001093, fcn.000010c8, fcn.00001114 -> Kontrol fonksiyonları.
```
Şimdi bildiklerimizin isimlendirmelerini yapalım.
`[0x000011a6]> afn main_            @ fcn.000011a6`
```text
0x00001203   call fcn.00001140       ; rdi = girdi buffer'ı
0x00001208   test eax, eax
0x0000120a   je 0x124b               ; eax == 0 ise 0x124b'ye atla
...
0x0000124b   lea rdi, str.Invalid_format.
0x00001252   call sym.imp.puts
```
`[0x000011a6]> afn check_format     @ fcn.00001140`

Diğer fonksiyonlara şimdilik geçici adlar tanımlayalım.

```text
[0x00001140]> afn fn_arg0          @ fcn.00001093
[0x00001140]> afn fn_arg5          @ fcn.000010c8
[0x00001140]> afn fn_arg10         @ fcn.00001114
```
En çok ilgimizi çeken ilk fonksiyona bir bakalım.

```text
[0x00001140]> pdf @ check_format
            ; CALL XREF from main_ @ 0x1203(x)
┌ 102: check_format (int64_t arg1);
│ `- args(rdi)
│           0x00001140      53             push rbx
│           0x00001141      4889fb         mov rbx, rdi                ; arg1
│           0x00001144      e8d7feffff     call sym.imp.strlen         ; size_t strlen(const char *s)
│           0x00001149      4889c2         mov rdx, rax ; rdx = uzunluk oldu.
│           0x0000114c      b800000000     mov eax, 0
│           0x00001151      4883fa0e       cmp rdx, 0xe ; UZUNLUK KONTROLÜ!! Eğer 14 değilse çık.
│       ┌─< 0x00001155      7547           jne 0x119e
│       │   0x00001157      807b042d       cmp byte [rbx + 4], 0x2d    ; '-' 4. indeks'te tire işareti
│      ┌──< 0x0000115b      7541           jne 0x119e
│      ││   0x0000115d      807b092d       cmp byte [rbx + 9], 0x2d    ; '-' 9. indeks'te tire işareti
│     ┌───< 0x00001161      753b           jne 0x119e
│     │││   0x00001163      b800000000     mov eax, 0
│    ┌────< 0x00001168      eb0a           jmp 0x1174
│    ││││   ; CODE XREFS from check_format @ 0x1188(x), 0x1190(x)
│  ┌┌─────> 0x0000116a      4883c001       add rax, 1
│  ╎╎││││   0x0000116e      4883f80e       cmp rax, 0xe
│ ┌───────< 0x00001172      7425           je 0x1199
│ │╎╎││││   ; CODE XREFS from check_format @ 0x1168(x), 0x11a4(x)
│ ───└────> 0x00001174      83f804         cmp eax, 4
│ │╎╎┌────< 0x00001177      7427           je 0x11a0
│ │╎╎││││   0x00001179      83f809         cmp eax, 9
│ ────────< 0x0000117c      7422           je 0x11a0
│ │╎╎││││   0x0000117e      0fb61403       movzx edx, byte [rbx + rax]
│ │╎╎││││   0x00001182      8d4abf         lea ecx, [rdx - 0x41]
│ │╎╎││││   0x00001185      80f919         cmp cl, 0x19
│ │└──────< 0x00001188      76e0           jbe 0x116a
│ │ ╎││││   0x0000118a      83ea30         sub edx, 0x30
│ │ ╎││││   0x0000118d      80fa09         cmp dl, 9
│ │ └─────< 0x00001190      76d8           jbe 0x116a
│ │  ││││   0x00001192      b800000000     mov eax, 0
│ │ ┌─────< 0x00001197      eb05           jmp 0x119e
│ │ │││││   ; CODE XREF from check_format @ 0x1172(x)
│ └───────> 0x00001199      b801000000     mov eax, 1
│   │││││   ; CODE XREFS from check_format @ 0x1155(x), 0x115b(x), 0x1161(x), 0x1197(x)
│   └─└└└─> 0x0000119e      5b             pop rbx
│    │      0x0000119f      c3             ret
│    │      ; CODE XREFS from check_format @ 0x1177(x), 0x117c(x)
│ ───└────> 0x000011a0      4883c001       add rax, 1
└ ────────< 0x000011a4      ebce           jmp 0x1174
```
Şimdilik 0x00001151, 0x00001157 ve 0x0000115d adreslerindeki olaylara bakalım. Detayına sonra ineceğiz.
İlk önemli instruction'umuz 14 karakterli olmasını kontrol ediyor. İkinci ve üçüncü instructionlarımız 4. ve 9. indekslerde '-' işaretinin olmasını kontrol ediyor. Bir deneyelim.

![2026-11-09_16-19.png](/uploads/8731ea86-2026-11-09_16-19.png)

Gördüğünüz gibi Format hatası vermek yerine Access Denied hatası verdi. Yani şifremiz kontrol etmeye değer hale geldi. Formatı tutturabildik. 

Diğer önemli fonksiyonlara bir göz atalım.

```text
[0x00001140]> pdf @ fn_arg0
            ; CALL XREF from main_ @ 0x120f(x)
┌ 53: fn_arg0 (int64_t arg1);
│ `- args(rdi)
│           0x00001093      b800000000     mov eax, 0
│           0x00001098      488d35a00f..   lea rsi, [0x0000203f]       ; "+^\x91\a"
│           0x0000109f      488d0d950f..   lea rcx, [0x0000203b]       ; "}f\xc0_+^\x91\a"
│           ; CODE XREF from fn_arg0 @ 0x10ba(x)
│       ┌─> 0x000010a6      0fb61407       movzx edx, byte [rdi + rax] ; arg1
│       ╎   0x000010aa      321406         xor dl, byte [rsi + rax]
│       ╎   0x000010ad      3a1401         cmp dl, byte [rcx + rax]
│      ┌──< 0x000010b0      7510           jne 0x10c2
│      │╎   0x000010b2      4883c001       add rax, 1
│      │╎   0x000010b6      4883f804       cmp rax, 4
│      │└─< 0x000010ba      75ea           jne 0x10a6
│      │    0x000010bc      b801000000     mov eax, 1
│      │    0x000010c1      c3             ret
│      │    ; CODE XREF from fn_arg0 @ 0x10b0(x)
│      └──> 0x000010c2      b800000000     mov eax, 0
└           0x000010c7      c3             ret
```
EAX Register'ımız burada for döngüsündeki i, 0x1098 ve 0x109f: İki lea, .rodata’daki iki dizinin adresini rsi ve rcx’e alıyor. lea içeriği okumaz, sadece adresi hesaplar. 

`0x10a6: movzx edx, byte [rdi + rax]`, girdinin i. karakterini edx’e alır böylece döngümüz devam edecek.

`0x10aa: xor dl, byte [rsi + rax]`

`0x10ad: cmp dl, byte [rcx + rax]`, sonucu 2. dizinin i. byte’ıyla karşılaştırır. Eşit değilse jne ile eax = 0 yoluna gider.

0x10b2 ve 0x10ba: i++, i != 4 ise döngü devam. 4 tur sonra eax = 1

Şimdi bayt dökümlerini okuyalım.

```text
[0x00001140]> px 8 @ 0x203b
- offset -  3B3C 3D3E 3F40 4142 4344 4546 4748 494A  BCDEF0123456789A
0x0000203b  7d66 c05f 2b5e 9107                      }f._+^..
```
İlk 4 byte enc (karşılaştırılan hedef), sonraki 4 byte tbl (XOR anahtarı)

Önceki crackme'de de XOR anahtarı çözmüştük. Formülü biliyoruz:

`
girdi[i] = enc[i] ^ tbl[i]`


```text
[0x00001140]> ? 0x7d ^ 0x2b
[0x00001140]> ? 0x66 ^ 0x5e
[0x00001140]> ? 0xc0 ^ 0x91
[0x00001140]> ? 0x5f ^ 0x07
```
Stringleri birleştirdiğimizde `V8QX` elde ediyoruz. Bu bizim ilk grubumuz. Şimdi ikinci grubu bulalım.

```text
[0x00001140]> pdf @ fn_arg5
            ; CALL XREF from main_ @ 0x121d(x)
┌ 76: fn_arg5 (int64_t arg1);
│ `- args(rdi)
│           0x000010c8      0fb637         movzx esi, byte [rdi]       ; arg1
│           0x000010cb      0fb65701       movzx edx, byte [rdi + 1]   ; arg1
│           0x000010cf      400fb6c6       movzx eax, sil
│           0x000010d3      0fb6ca         movzx ecx, dl
│           0x000010d6      01c8           add eax, ecx
│           0x000010d8      b900000000     mov ecx, 0
│           0x000010dd      3d85000000     cmp eax, 0x85
│       ┌─< 0x000010e2      752d           jne 0x1111
│       │   0x000010e4      0fb64702       movzx eax, byte [rdi + 2]   ; arg1
│       │   0x000010e8      31c2           xor edx, eax
│       │   0x000010ea      80fa03         cmp dl, 3
│      ┌──< 0x000010ed      7522           jne 0x1111
│      ││   0x000010ef      0fb65703       movzx edx, byte [rdi + 3]   ; arg1
│      ││   0x000010f3      0fb6c0         movzx eax, al
│      ││   0x000010f6      0fb6ca         movzx ecx, dl
│      ││   0x000010f9      29c8           sub eax, ecx
│      ││   0x000010fb      b900000000     mov ecx, 0
│      ││   0x00001100      83f809         cmp eax, 9
│     ┌───< 0x00001103      750c           jne 0x1111
│     │││   0x00001105      31d6           xor esi, edx
│     │││   0x00001107      4080fe73       cmp sil, 0x73               ; 's'
│     │││   0x0000110b      0f94c1         sete cl
│     │││   0x0000110e      0fb6c9         movzx ecx, cl
│     │││   ; CODE XREFS from fn_arg5 @ 0x10e2(x), 0x10ed(x), 0x1103(x)
│     └└└─> 0x00001111      89c8           mov eax, ecx
└           0x00001113      c3             ret
```
Bu fonksiyonumuz epey zor görünmekte.
Devam edelim.

```text
movzx esi, byte [rdi]
movzx edx, byte [rdi + 1]
add eax, ecx
cmp eax, 0x85
jne 0x1111
```
Burada ilk iki karakterin toplamı alınıyor. 0x85'e eşit olup olmadığı kontrol ediliyor.

```text
movzx eax, byte [rdi + 2]
xor edx, eax
cmp dl, 3
jne 0x1111
```
[rdi + 2]: Üçüncü karakter.

edx: İkinci karakterin değerini tutuyordu

xor edx, eax: İkinci ve üçüncü karaktere XOR uyguluyor.

cmp dl, 3: XOR sonucunun 3 olup olmadığını kontrol ediyor.

```text
movzx edx, byte [rdi + 3]
sub eax, ecx
cmp eax, 9
jne 0x1111
```

[rdi + 3]: Dördüncü karakter.

sub: Üçüncü karakterden dördüncü karakterin ASCII değerini çıkarıyor.

cmp eax, 9: Sonucun 9 olmasını istiyor.
```text
xor esi, edx
cmp sil, 0x73
sete cl
```
esi: Birinci karakterin değerini tutuyor.

edx: Dördüncü karakterin değerini tutuyor.

xor esi, edx: Bu iki karakter arasında XOR gerçekleştiriyor.

0x73: Hexadecimal olarak 115, yani ASCII'de 's'.

sete cl: Karşılaştırma eşitse cl = 1, değilse cl = 0 yapıyor.

Koşulları sıraladığımızda:
```text
No.	Koşul	        Assembly
1	a + b == 133	cmp eax, 0x85
2       (b ^ c) == 3	cmp dl, 3
3	c - d == 9	cmp eax, 9
4	(a ^ d) == 115	cmp sil, 0x73
```
İkinci parça `7NMD`

Artık son parçaya gelebiliriz.

```text
[0x00001140]> pdf @ fn_arg10
            ; CALL XREF from main_ @ 0x122b(x)
┌ 44: fn_arg10 (uint32_t arg1);
│ `- args(rdi)
│           0x00001114      488d4f04       lea rcx, [rdi + 4]          ; arg1
│           0x00001118      ba05150000     mov edx, 0x1505
│           ; CODE XREF from fn_arg10 @ 0x1132(x)
│       ┌─> 0x0000111d      c1c205         rol edx, 5
│       ╎   0x00001120      0fb607         movzx eax, byte [rdi]       ; arg1
│       ╎   0x00001123      31d0           xor eax, edx
│       ╎   0x00001125      69d093010001   imul edx, eax, 0x1000193
│       ╎   0x0000112b      4883c701       add rdi, 1                  ; arg1
│       ╎   0x0000112f      4839cf         cmp rdi, rcx                ; arg1
│       └─< 0x00001132      75e9           jne 0x111d
│           0x00001134      3d05ad381c     cmp eax, 0x1c38ad05
│           0x00001139      0f94c0         sete al
│           0x0000113c      0fb6c0         movzx eax, al
└           0x0000113f      c3             ret 

```

```text
lea rcx, [rdi + 4]
mov edx, 0x1505
```
rcx: Kontrol edilecek 4 karakterin bittiği adres.

edx: Başlangıç değeri 0x1505 (5381).

```text
rol edx, 5
movzx eax, byte [rdi]
xor eax, edx
imul edx, eax, 0x1000193
```
rol: edx değerinin bitlerini 5 konum sola döndürür.

movzx: Sıradaki karakterin ASCII değerini eax içine alır.

xor: Karakterin değeriyle döndürülmüş edx değerine XOR uygular.

imul: XOR sonucunu 0x1000193 ile çarpar, sonucu edx içine yazar.

```text
add rdi, 1
cmp rdi, rcx
jne 0x111d
```
^^ Döngü

```text
cmp eax, 0x1c38ad05
sete al
```
Son karakterin XOR sonucunu 0x1c38ad05 ile karşılaştırır
Burada koşulu sağlayan girdimiz `3KPA` şimdi bulduğumuz parçaları birleştirelim.

**`V8QX-7NMD-3KPA`**


![2026-11-09_16-45.png](/uploads/8689dfe8-2026-11-09_16-45.png)
