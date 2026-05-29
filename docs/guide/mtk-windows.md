### No MIUI Tool · Full Backup · Clean Flash · Error Recovery · Rollback

> **Platform:** Windows 10 / 11 — all commands run in **Command Prompt (CMD)** or **PowerShell**

---

> ⚠️ **Warning:** This process **wipes all data** and may void your warranty.
> Take a full backup before proceeding. You assume all responsibility.

---

## Table of Contents

- [Phase 1 — Prerequisites & Full Backup](#phase-1--prerequisites--full-backup)
- [Phase 2 — BROM Mode & Bootloader Unlock (no MIUI tool)](#phase-2--brom-mode--bootloader-unlock-no-miui-tool)
- [Phase 3 — Clean ROM Flash](#phase-3--clean-rom-flash)
  - [Method A — SP Flash Tool](#method-a--sp-flash-tool-stock-rom)
  - [Method B — Xiaomi Flash Tool](#method-b--xiaomi-flash-tool-xiaomi-devices-only)
  - [Method C — MTKClient Direct](#method-c--mtkclient-direct)
- [Phase 4 — Error Recovery & vbmeta Bypass](#phase-4--error-recovery--vbmeta-bypass)
- [Phase 5 — Full Rollback / Relock](#phase-5--full-rollback--relock)
- [Troubleshooting Guide — Bootloop, Soft Brick & Hard Brick](#troubleshooting-guide--bootloop-soft-brick--hard-brick)

---

## Phase 1 — Prerequisites & Full Backup

### Step 1 — Install Python 3.x

Download from the official site and run the installer.
**During setup, check the box: `Add Python to PATH`.**

> 📥 **Note:** You can get this file from **[python.org/downloads](https://python.org/downloads)**

Verify the install worked — open CMD and run:

```cmd
python --version
```

---

### Step 2 — Install MediaTek USB Drivers

Required so Windows recognises your device in BROM / preloader mode.
Run the installer `.exe` and follow the prompts.

> 📥 **Note:** You can get this file from **[github.com/bkerler/mtkclient](https://github.com/bkerler/mtkclient)** → `Drivers` folder

---

### Step 3 — Install UsbDk

Required for MTKClient to communicate with your device at a low level.
Download the `.msi`, run it, follow the installer.

> 📥 **Note:** You can get this file from **[github.com/daynix/UsbDk/releases](https://github.com/daynix/UsbDk/releases)** → `UsbDk_1.x.x_x64.msi`

---

### Step 4 — Download MTKClient

Extract the ZIP into your Python installation directory.

Default path example:

```
C:\Users\YourName\AppData\Local\Programs\Python\Python312\mtkclient\
```

> 📥 **Note:** You can get this file from **[github.com/bkerler/mtkclient](https://github.com/bkerler/mtkclient)** → Code → Download ZIP

---

### Step 5 — Install Python Dependencies

Open CMD **inside the MTKClient folder** (type `cmd` in the address bar of Explorer and hit Enter):

```cmd
python setup.py install
```

```cmd
python -m pip install -r requirements.txt
```

---

### Step 6 — Back Up Critical Partitions *(your undo image)*

| Partition | Why it matters |
|-----------|---------------|
| `preloader` | Lowest-level bootloader — corrupted = hard brick |
| `seccfg` | Stores the bootloader lock state — modified during unlock |
| `nvram` | IMEI, Wi-Fi / BT MAC, antenna calibration — lose this = no signal |
| `nvdata` | Companion to nvram, modem config |
| `persist` | DRM keys, fingerprint calibration data |
| `boot` | Android kernel — needed if boot gets corrupted mid-flash |
| `vendor` | HAL and driver blobs — system won't boot without a matching vendor |

Boot your device to BROM mode first *(see Phase 2, Step 1)*, then run:

```cmd
python mtk rl backup_folder --skip-xml --parttype=preloader,seccfg,nvram,nvdata,persist,boot,vendor
```

> ✅ **Result: ~500 MB to 2 GB total, done in under 5 minutes.**
> Keep this folder somewhere safe — it is your complete rollback if anything goes wrong.

To restore a single partition if needed (e.g. only `seccfg` got corrupted):

```cmd
python mtk w seccfg,backup_folder\seccfg.bin
```

> 💡 **Windows path tip:** Use backslashes `\` for local paths, or wrap paths with spaces in quotes:
> `python mtk w seccfg,"C:\Users\YourName\backup_folder\seccfg.bin"`

---

## Phase 2 — BROM Mode & Bootloader Unlock (no MIUI tool)

### Step 1 — Boot Device into BROM Mode

Power off the device completely. Try one of the following while plugging in USB:

| Option | Key Combination |
|--------|----------------|
| A | Hold **Volume Down** → plug USB |
| B | Hold **Volume Up + Volume Down** → plug USB |
| C | Hold **Volume Up + Volume Down + Power** → plug USB |
| D *(no buttons)* | Remove battery briefly → plug USB |

**To confirm BROM mode:** Check Device Manager — look for an unknown device or `MediaTek USB Port`.
Then confirm via CMD:

```cmd
python mtk printgpt
```

If it responds with partition info, you're in BROM.

---

### Step 2 — Bypass Authentication *(replaces MIUI unlock tool)*

MTKClient handles auth bypass internally — no Mi account or waiting period needed.
If you get an auth error, run:

```cmd
python mtk payload
```

> 💡 This sends the bypass payload automatically. Reconnect in BROM mode after it completes.

---

### Step 3 — Wipe Metadata & Userdata

Required before unlocking. **This erases all user data:**

```cmd
python mtk e metadata,userdata,md_udc
```

---

### Step 4 — Reconnect to BROM, then Unlock Bootloader

Power off and re-enter BROM mode. Then run *(try in order)*:

```cmd
python mtk xflash seccfg unlock
```

If the above fails:

```cmd
python mtk da seccfg unlock
```

> ✅ **Bootloader is now unlocked.**
> Boot to the OS once to let Android initialise the unlocked state, then proceed to flash your ROM.

---

## Phase 3 — Clean ROM Flash

| Method | Best for |
|--------|----------|
| **A — SP Flash Tool** | Any MTK device, stock scatter-based ROMs |
| **B — Xiaomi Flash Tool** | Xiaomi / Redmi / POCO devices, official MIUI / HyperOS ROMs |
| **C — MTKClient Direct** | Flashing individual partition images |

---

### Method A — SP Flash Tool *(stock ROM)*

#### Step 1 — Download SP Flash Tool

> 📥 **Note:** You can get this file from **[spflashtool.com](https://spflashtool.com)** or your device's XDA thread

#### Step 2 — Flash

1. Run `flash_tool.exe` as **Administrator**
2. Click the **Download** tab → load `scatter.txt` from your ROM folder
3. Select **Download Only**
4. Click **Download**
5. Power off phone → connect via USB cable

> ⚠️ **Do not flash the `preloader` partition** if your device uses a locked preloader.
> Uncheck it in the scatter file to avoid a hard brick.

---

### Method B — Xiaomi Flash Tool *(Xiaomi devices only)*

#### Step 1 — Download Xiaomi Flash Tool (MiFlash)

> 📥 **Note:** You can get this file from **[miuirom.org/miflash](https://miuirom.org/miflash)** or the official Xiaomi community site → Tools section

#### Step 2 — Download a Fastboot ROM

> 📥 **Note:** You can get fastboot ROMs from **[xiaomifirmwareupdater.com](https://xiaomifirmwareupdater.com)** or **[miuirom.org](https://miuirom.org)** — select your device and choose the **Fastboot** tab

#### Step 3 — Install MiFlash & ADB Drivers

Run the MiFlash installer. Drivers install automatically.

> 💡 If drivers fail, install manually from the `driver` folder inside the MiFlash install directory.

#### Step 4 — Extract the Fastboot ROM

Extract the `.tgz` archive. You'll see a folder with `images\` and `flash_all.bat`.

#### Step 5 — Boot to Fastboot Mode

```cmd
adb reboot bootloader
```

Or power off → hold **Volume Down** → connect USB. Verify:

```cmd
fastboot devices
```

#### Step 6 — Flash via MiFlash

1. Open MiFlash as **Administrator**
2. Click **Select** → point to the extracted ROM folder
3. Choose your flash mode:

| Mode | What it does |
|------|-------------|
| `flash_all` | Wipes everything — clean install *(recommended)* |
| `flash_all_lock` | Clean install + relocks bootloader |
| `flash_all_except_storage` | Keeps userdata |

4. Click **Flash** — wait for `Flash done` (3–8 minutes)

#### Step 7 — Fix vbmeta if Bootloop Occurs

```cmd
fastboot oem cdms
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img
fastboot reboot
```

> 📥 **Note:** You can get `vbmeta.img` from inside the `images\` folder of your extracted fastboot ROM

---

### Method C — MTKClient Direct

```cmd
python mtk w boot,boot.img
python mtk w system,system.img
python mtk w vendor,vendor.img
```

---

### First Boot *(all methods)*

> ⏳ First boot after a clean flash can take **5–15 minutes**. Do not interrupt it.

---

## Phase 4 — Error Recovery & vbmeta Bypass

### Error: `dm-verity corruption` / Bootloop after Flash

```cmd
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img
fastboot reboot
```

> 📥 **Note:** You can get `vbmeta.img` from your ROM zip or from your `backup_folder`

---

### Error: Xiaomi-specific `cdms` / dm-verity after Unlock

```cmd
fastboot oem cdms
fastboot reboot
```

---

### Error: Stuck in Bootloop — Flash Recovery First

```cmd
python mtk w recovery,twrp.img
```

> 📥 **Note:** You can get TWRP from **[twrp.me/Devices](https://twrp.me/Devices)** or your device's XDA thread

---

### Error: MTKClient Auth Failure / `Brom Exception`

- Try a different USB cable
- Use a rear USB port directly *(no hub)*
- Reinstall UsbDk
- Ensure no other MTK tools are running
- Retry the BROM connection

---

### Nuclear Option — Full Restore from Backup

```cmd
python mtk wl backup_folder
```

> 🔴 **Restores everything including the locked bootloader state.**

---

## Phase 5 — Full Rollback / Relock

### Step 1 — Prepare Device for Relock

- Flash stock ROM
- Unroot (remove Magisk or reflash stock boot)
- Restore stock recovery

> ⚠️ **Back up your data** — relocking wipes the device again.

---

### Step 2 — Boot to BROM Mode and Relock

```cmd
python mtk xflash seccfg lock
```

Or if you used the `da` method:

```cmd
python mtk da seccfg lock
```

---

### Step 3 — Full Backup Restore *(alternative rollback)*

```cmd
python mtk wl backup_folder
```

> ✅ **Rollback complete. Device restored to original state including locked bootloader.**

---

## Troubleshooting Guide — Bootloop, Soft Brick & Hard Brick

### How to tell which state you're in

| Symptom | What it is |
|---------|-----------|
| Phone restarts repeatedly, never reaches home screen | **Bootloop** |
| Stuck on logo / black screen but responds to button combos or ADB | **Soft Brick** |
| No screen, no vibration, not detected by PC at all | **Hard Brick** |

---

### 🔁 Bootloop

**Step 1 — Try entering recovery manually**
Power off → hold **Volume Up + Power** until recovery appears.

**Step 2 — Disable vbmeta verification**

```cmd
fastboot --disable-verity --disable-verification flash vbmeta vbmeta.img
fastboot reboot
```

**Step 3 — Flash boot partition only**

```cmd
python mtk w boot,backup_folder\boot.bin
```

**Step 4 — Full clean flash**
Use SP Flash Tool or MiFlash with `flash_all` mode *(see Phase 3)*.

**Step 5 — Restore critical partitions from backup**

```cmd
python mtk w seccfg,backup_folder\seccfg.bin
python mtk w boot,backup_folder\boot.bin
python mtk w vendor,backup_folder\vendor.bin
```

---

### 🟡 Soft Brick

**Step 1 — Confirm BROM access**

```cmd
python mtk printgpt
```

**Step 2 — Restore seccfg**

```cmd
python mtk w seccfg,backup_folder\seccfg.bin
```

**Step 3 — Restore nvram / nvdata *(no signal / null IMEI)***

```cmd
python mtk w nvram,backup_folder\nvram.bin
python mtk w nvdata,backup_folder\nvdata.bin
```

> ⚠️ **Never flash someone else's nvram.** Using another device's IMEI is illegal in most countries.

**Step 4 — Flash TWRP and reflash ROM**

```cmd
python mtk w recovery,twrp.img
```

Boot into TWRP → Advanced Wipe → System, Data, Cache, Dalvik → flash ROM zip.

**Step 5 — Full partition restore**

```cmd
python mtk wl backup_folder
```

---

### 🔴 Hard Brick

**Step 1 — Rule out the obvious**
- Different USB cable, different rear port, different PC
- Charge for 30 minutes — dead battery won't enter BROM

**Step 2 — Try BROM without battery *(removable only)***
Remove battery, connect USB only — chip may enter BROM from USB power alone.

**Step 3 — Try SP Flash Tool**
Open SP Flash Tool → load scatter → click Download → connect powered-off device.

**Step 4 — Short the test point *(advanced)*

> 📥 **Note:** You can find the test point location for your device on **[gsmforum.net](https://gsmforum.net)** or XDA — search `[your model] test point`

Once detected via test point:

```cmd
python mtk w preloader,backup_folder\preloader.bin
```

Then reflash full ROM via SP Flash Tool.

**Step 5 — Hardware repair**
- **ISP:** Shop reads/writes eMMC directly — recoverable
- **eMMC swap:** Last resort, data lost

> 💡 Bring your `backup_folder` to the shop — they can restore your IMEI from `nvram.bin`.

---

*Guide compiled from MTKClient documentation and community-sourced methods.
Always verify commands against the latest MTKClient release notes on GitHub.*
