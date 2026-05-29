### Redmi Note 15 (spinel) · Helio G100 Ultra · Android 15 / HyperOS 2 · Kernel 6.12.30

---

> ⚠️ **Warning:** This is experimental software. ReSukiSU is a new fork of SukiSU Ultra which is itself a fork of KernelSU. Bootloops and instability are explicitly warned by the project. **Back up your boot image before proceeding. You assume all responsibility.**

---

## What you're actually doing

The Redmi Note 15 (spinel) has a **closed kernel source** — Xiaomi released the OSS tree (`spinel-v-oss`) but there is no way to build a device-specific kernel with custom patches.

The solution is **GKI (Generic Kernel Image)** — a standardised kernel Google mandates on all Android 12+ devices. Because every Android 15 device runs the same GKI ABI, a prebuilt GKI kernel with ReSukiSU + SUSFS baked in will work on spinel without any device-specific compilation.

**Why not LKM mode?** LKM (Loadable Kernel Module) inserts KernelSU into the stock kernel at runtime — much safer, but it cannot carry SUSFS because SUSFS requires hooks compiled into the kernel itself. GKI replacement is the only way to get SUSFS working.

---

## Component Summary

|Component|Version|Status|
|---|---|---|
|ReSukiSU|34857|Stable|
|SUSFS|v2.1.0|Pre-release|
|Kernel|android16-6.12.30|GKI|
|Magic Mount|✅ Supported|—|
|BBG security patch|❌ Not supported|—|
|LZ4KD / ONEPLUS_LZ4K|❌ Not enabled|—|
|LZ4|v1.10.0 (not enabled)|—|
|SUSFS Hooks|Inline|—|

> 💡 **Unicode zero-width bypass** is NOT built in — use the Xposed module for that.

---

## Table of Contents

- [Phase 0 — Before You Start](#phase-0--before-you-start)
- [Phase 1 — Download Everything](#phase-1--download-everything)
- [Phase 2 — Back Up Stock Boot Image](#phase-2--back-up-stock-boot-image)
- [Phase 3 — Flash the GKI Kernel via AnyKernel3](#phase-3--flash-the-gki-kernel-via-anykernel3)
- [Phase 4 — Install ReSukiSU Manager & SUSFS Module](#phase-4--install-resukisu-manager--susfs-module)
- [Phase 5 — Verify Root & SUSFS](#phase-5--verify-root--susfs)
- [Rollback — Restore Stock Boot](#rollback--restore-stock-boot)
- [Troubleshooting — Bootloop & Issues](#troubleshooting--bootloop--issues)

---

## Phase 0 — Before You Start

### Requirements checklist

- [ ] Bootloader **unlocked** _(see the MTK bootloader unlock guide)_
- [ ] ADB & fastboot installed and working on your PC
- [ ] Device on **HyperOS 2.0** (Android 15) — do not flash on HyperOS 1 / MIUI
- [ ] Battery **above 60%**
- [ ] USB debugging enabled in Developer Options
- [ ] Device confirmed as codename **spinel** — verify:

```bash
fastboot getvar product
# or via ADB while booted:
adb shell getprop ro.product.device
```

Expected output: `spinel`

> ⚠️ **Do not flash on any other device.** GKI kernels are ABI-compatible across Android 15 devices but the AnyKernel3 script targets spinel's partition layout.

---

### Understand which partition gets flashed

On Android 15 GKI2.0 devices like spinel, the kernel lives in **`init_boot`**, not `boot`. The AnyKernel3 zip handles this automatically — but it's important to know so you back up the right partition and flash the right one if doing it manually.

|Partition|Contains|Flash target for GKI?|
|---|---|---|
|`boot`|Ramdisk + kernel (older devices)|❌ No for spinel|
|`init_boot`|Generic ramdisk on GKI2.0|✅ Yes — this is what gets patched|
|`vendor_boot`|Vendor-specific ramdisk|❌ Do not touch|

---

## Phase 1 — Download Everything

### 1.1 — GKI AnyKernel3 ZIP (ReSukiSU + SUSFS v2.1.0)

> 📥 **Note:** You can get this file from **[github.com/zzh20188/GKI_KernelSU_SUSFS/releases/tag/v2.1.0-r4](https://github.com/zzh20188/GKI_KernelSU_SUSFS/releases/tag/v2.1.0-r4)**
> 
> Download: `android16-6.12.30-2025-07-AnyKernel3.zip`

---

### 1.2 — ReSukiSU Manager APK

> 📥 **Note:** You can get this file from **[github.com/rsuntk/KernelSU/releases](https://github.com/rsuntk/KernelSU/releases)**
> 
> Download the latest `ReSukiSU-Manager-*.apk`

---

### 1.3 — SUSFS Module (ksu_module_susfs)

> 📥 **Note:** You can get this file from **[github.com/sidex15/ksu_module_susfs/releases](https://github.com/sidex15/ksu_module_susfs)**
> 
> Download the latest `susfs4ksu-*.zip`

---

### 1.4 — Stock `init_boot` image _(for backup and rollback)_

Extract from your current HyperOS 2.0 fastboot ROM:

> 📥 **Note:** You can get the fastboot ROM from **[xiaomifirmwareupdater.com](https://xiaomifirmwareupdater.com)** → select `spinel` → Fastboot tab → download the `.tgz` matching your region

Extract the `.tgz` — the `init_boot.img` file will be inside the `images/` folder.If there isn't before proceeding backup from device as mentioned in the next phase.

---

## Phase 2 — Back Up Stock Boot Image

This is your **single most important safety step**. If anything goes wrong you restore this and your device is back to exactly where it started.

### Method A — via ADB (device booted, recommended)

```bash
adb shell su -c "dd if=/dev/block/by-name/init_boot of=/sdcard/init_boot_stock.img"
adb pull /sdcard/init_boot_stock.img ./init_boot_stock.img
```

### Method B — via fastboot (device in fastboot mode)

Boot to fastboot mode first:

```bash
adb reboot bootloader
```

Then dump the partition:

```bash
fastboot getvar all 2>&1 | grep init_boot
fastboot flash --skip-reboot init_boot init_boot_stock.img   # only if you already have the stock img
```

> 💡 If you don't have root yet, extract `init_boot.img` directly from the fastboot ROM zip _(Phase 1, Step 1.4)_ — this is the cleanest stock backup.

### Store the backup safely

```bash
# Rename it clearly so you never confuse it with patched versions
cp init_boot.img init_boot_STOCK_spinel_HyperOS2.img
```

Keep this file on your PC, a USB drive, and ideally cloud storage.

---

## Phase 3 — Flash the GKI Kernel via AnyKernel3

The AnyKernel3 zip is the simplest and recommended method — it handles detecting and flashing the correct partition automatically.

### Method A — via TWRP / Custom Recovery _(if you have recovery installed)_

1. Boot into TWRP
2. Transfer the zip to your device:

```bash
adb push android16-6.12.30-2025-07-AnyKernel3.zip /sdcard/
```

3. In TWRP: Install → select the zip → swipe to confirm
4. Do **not** wipe anything — just flash the kernel zip
5. Reboot to System

---

### Method B — via fastboot boot + Horizon Kernel Flasher _(no recovery needed)_

This is the recommended method for spinel since TWRP support is limited.

#### Step 1 — Get a temporary boot image to sideload root

You need to `fastboot boot` a GKI boot image temporarily so you can flash AnyKernel3 from within Android using Horizon Kernel Flasher.

> 📥 **Note:** You can get the matching GKI boot image from **[github.com/zzh20188/GKI_KernelSU_SUSFS/releases/tag/v2.1.0-r4](https://github.com/zzh20188/GKI_KernelSU_SUSFS/releases/tag/v2.1.0-r4)**
> 
> Look for: `android16-6.12.30-2025-07-boot.img` (or `boot-gz.img` depending on what's available)

> 📥 **Note:** You can get Horizon Kernel Flasher from **[github.com/MrIsaacMontalvan/horizon-kernel-flasher/releases](https://github.com/MrIsaacMontalvan/horizon-kernel-flasher/releases)** or search "Horizon Kernel Flasher" on the Play Store / F-Droid

#### Step 2 — Boot temporarily into the GKI kernel

```bash
adb reboot bootloader
```

```bash
fastboot boot android16-6.12.30-2025-07-boot.img
```

> 💡 `fastboot boot` is **temporary** — it does not write anything to storage. If it bootloops, just force-reboot by holding Power — your stock kernel is still intact.

#### Step 3 — Install ReSukiSU Manager APK

Once booted into the temporary GKI kernel:

```bash
adb install ReSukiSU-Manager-*.apk
```

Open the Manager — it should show ReSukiSU is running and ask you to grant root.

#### Step 4 — Flash AnyKernel3 permanently via Horizon Kernel Flasher

1. Push the AnyKernel3 zip to your device:

```bash
adb push android16-6.12.30-2025-07-AnyKernel3.zip /sdcard/
```

2. Open **Horizon Kernel Flasher** on the device
3. Select the AnyKernel3 zip
4. Flash and let it reboot

The GKI kernel with ReSukiSU + SUSFS is now permanently written to `init_boot`.

---

### Method C — manual fastboot flash _(direct, no recovery or temp boot)_

If you extracted the `Image` from the AnyKernel3 zip and patched it into your stock `init_boot.img` using magiskboot:

```bash
# On PC — unpack stock init_boot
./magiskboot unpack init_boot_STOCK_spinel_HyperOS2.img

# Replace the kernel
cp Image kernel

# Repack
./magiskboot repack init_boot_STOCK_spinel_HyperOS2.img new-init_boot.img

# Flash permanently
adb reboot bootloader
fastboot flash init_boot new-init_boot.img
fastboot reboot
```

> 📥 **Note:** You can get `magiskboot` for your OS from **[github.com/topjohnwu/Magisk/releases](https://github.com/topjohnwu/Magisk/releases)** → rename the `.apk` to `.zip` → extract `lib/arm64-v8a/libmagiskboot.so` → rename to `magiskboot`

---

## Phase 4 — Install ReSukiSU Manager & SUSFS Module

### Step 1 — Install ReSukiSU Manager

```bash
adb install ReSukiSU-Manager-*.apk
```

Open the app. If the kernel was flashed correctly, it will show:

```
KernelSU is running
Version: 34857
```

---

### Step 2 — Install the SUSFS module

1. Open ReSukiSU Manager → Modules tab
2. Tap the `+` button → select `susfs4ksu-*.zip`
3. Flash and reboot

Or via ADB if you prefer:

```bash
adb push susfs4ksu-*.zip /sdcard/
```

Then install via the Manager's module installer pointing to that path.

---

### Step 3 — Grant superuser to apps that need root

Open ReSukiSU Manager → Superuser tab. Apps that request root will appear here. Grant or deny as needed.

> 💡 SUSFS works at the kernel level — you don't need to configure it manually. Installing the module is enough for it to start hiding root from apps and services.

---

## Phase 5 — Verify Root & SUSFS

### Verify root is working

```bash
adb shell su -c "id"
# Expected: uid=0(root) gid=0(root)
```

Or install a root checker app. ReSukiSU Manager should also show active grants.

---

### Verify SUSFS is active

```bash
adb shell su -c "cat /proc/version"
```

Look for `SukiSU` or `ReSukiSU` in the kernel string. Then:

```bash
adb shell su -c "ls /data/adb/modules/susfs4ksu"
```

Should show module files confirming it's installed and active.

---

### Verify KMI compatibility

```bash
adb shell uname -r
# Expected: 6.12.30-android16-...
```

If you see `6.12.30` you're running the correct GKI kernel.

---

## Rollback — Restore Stock Boot

If anything goes wrong at any point, restore your stock `init_boot` backup:

```bash
adb reboot bootloader
```

```bash
fastboot flash init_boot init_boot_STOCK_spinel_HyperOS2.img
```

```bash
fastboot reboot
```

> ✅ Your device is back to stock — no root, stock kernel, everything as it was. This works even if the device is in a bootloop, as long as fastboot is accessible.

---

## Troubleshooting — Bootloop & Issues

### Bootloop immediately after flashing

The GKI kernel version may not be compatible with your current HyperOS 2.0 security patch level. This is the most common cause.

**Fix:** Restore stock `init_boot` via fastboot _(see Rollback above)_, then check the release notes for a compatible kernel version. The `2025-07` build targets the July 2025 SPL.

```bash
# Check your current SPL while booted
adb shell getprop ro.build.version.security_patch
```

If your SPL is newer than July 2025, the kernel may mismatch. Look for a newer release at:

> 📥 **Note:** You can get newer releases from **[github.com/zzh20188/GKI_KernelSU_SUSFS/releases](https://github.com/zzh20188/GKI_KernelSU_SUSFS/releases)**

---

### ReSukiSU Manager shows "not installed" / unsupported

The GKI kernel didn't flash to `init_boot` correctly, or the device booted back to the stock kernel. Verify which kernel is running:

```bash
adb shell uname -r
```

If it shows the stock kernel version, redo Phase 3.

---

### Root works but SUSFS module fails to load

Check module status:

```bash
adb shell su -c "cat /data/adb/modules/susfs4ksu/update"
```

If the module is marked as failed, try reflashing the SUSFS module zip via the Manager. Make sure you're using the version from the recommended module link:

> 📥 **Note:** You can get the SUSFS module from **[github.com/sidex15/ksu_module_susfs/releases](https://github.com/sidex15/ksu_module_susfs)**

---

### App still detects root after SUSFS

SUSFS hides mount points and path traces but does not handle every detection vector. For apps using DRM or advanced integrity checks:

- Use the **Xposed module** for Unicode zero-width bypass _(noted as unsupported natively)_
- Use **Shamiko** or **ZygiskNext** if you need Zygisk-level hiding
- Check if the app uses **Play Integrity** — SUSFS alone does not fix Play Integrity failures

---

### Can't enter fastboot mode

Hold **Volume Down + Power** for 10+ seconds. Or from ADB while booted:

```bash
adb reboot bootloader
```

If the device is in a hard bootloop and won't respond to ADB, enter BROM mode via MTKClient _(see the MTK bootloader unlock guide, Phase 2)_ and restore `init_boot` directly:

```bash
python3 mtk.py w init_boot,init_boot_STOCK_spinel_HyperOS2.img
```

---

_ReSukiSU is actively maintained. Check [github.com/rsuntk/KernelSU](https://github.com/rsuntk/KernelSU) for updates. GKI kernel releases at [github.com/zzh20188/GKI_KernelSU_SUSFS](https://github.com/zzh20188/GKI_KernelSU_SUSFS)._