/**
 * 0.1.7-rc.2 适配新增文案的本地化补齐:
 * 1) Webview 词典(src/webview/texts/*.json):定时任务(自动化任务)面板、逐消息反馈、
 *    预设作者能力提示等新键(中文为源语言,不入词典);
 * 2) 宿主 l10n 包(l10n/bundle.l10n.*.json):反馈与预设作者能力相关的新键
 *    (英文包给出源串,其余语言给译文,zh-cn / zh-tw 同步给出中文)。
 * 仅追加缺失键,不重排既有内容。
 */
import fs from "node:fs";
import path from "node:path";

const root = "D:/Workspace/vscode";

/** 键 → 各语言译文(zh-cn 为源语言,不入词典)。 */
const WEBVIEW_KEYS = {
  "自动化任务": {
    "zh-tw": "自動化任務", ja: "自動化タスク", ko: "자동화 작업", de: "Automatisierte Aufgaben",
    fr: "Tâches automatisées", es: "Tareas automatizadas", pt: "Tarefas automatizadas", th: "งานอัตโนมัติ",
    id: "Tugas otomatis", tr: "Otomatik görevler", ru: "Автоматические задачи", ar: "المهام الآلية",
  },
  "一次性": {
    "zh-tw": "一次性", ja: "1 回のみ", ko: "1회", de: "Einmalig",
    fr: "Une fois", es: "Una vez", pt: "Uma vez", th: "ครั้งเดียว",
    id: "Sekali", tr: "Bir kez", ru: "Однократно", ar: "مرة واحدة",
  },
  "周一,周二,周三,周四,周五,周六,周日": {
    "zh-tw": "週一,週二,週三,週四,週五,週六,週日", ja: "月,火,水,木,金,土,日", ko: "월,화,수,목,금,토,일",
    de: "Mo,Di,Mi,Do,Fr,Sa,So", fr: "lun,mar,mer,jeu,ven,sam,dim", es: "lun,mar,mié,jue,vie,sáb,dom",
    pt: "seg,ter,qua,qui,sex,sáb,dom", th: "จ,อ,พ,พฤ,ศ,ส,อา", id: "Sen,Sel,Rab,Kam,Jum,Sab,Min",
    tr: "Pzt,Sal,Çar,Per,Cum,Cmt,Paz", ru: "Пн,Вт,Ср,Чт,Пт,Сб,Вс", ar: "الاثنين,الثلاثاء,الأربعاء,الخميس,الجمعة,السبت,الأحد",
  },
  "搜索任务": {
    "zh-tw": "搜尋任務", ja: "タスクを検索", ko: "작업 검색", de: "Aufgaben suchen",
    fr: "Rechercher des tâches", es: "Buscar tareas", pt: "Pesquisar tarefas", th: "ค้นหางาน",
    id: "Cari tugas", tr: "Görev ara", ru: "Поиск задач", ar: "بحث في المهام",
  },
  "全部": {
    "zh-tw": "全部", ja: "すべて", ko: "전체", de: "Alle",
    fr: "Tout", es: "Todo", pt: "Tudo", th: "ทั้งหมด",
    id: "Semua", tr: "Tümü", ru: "Все", ar: "الكل",
  },
  "已开启": {
    "zh-tw": "已開啟", ja: "有効", ko: "사용 중", de: "Aktiv",
    fr: "Activé", es: "Habilitado", pt: "Ativado", th: "เปิดใช้",
    id: "Aktif", tr: "Etkin", ru: "Включено", ar: "مُمكَّن",
  },
  "重新读取任务列表": {
    "zh-tw": "重新讀取任務清單", ja: "タスク一覧を再読み込み", ko: "작업 목록 다시 읽기", de: "Aufgabenliste neu laden",
    fr: "Recharger la liste des tâches", es: "Recargar la lista de tareas", pt: "Recarregar a lista de tarefas",
    th: "โหลดรายการงานใหม่", id: "Muat ulang daftar tugas", tr: "Görev listesini yeniden yükle",
    ru: "Перечитать список задач", ar: "إعادة تحميل قائمة المهام",
  },
  "正在加载任务…": {
    "zh-tw": "正在載入任務…", ja: "タスクを読み込み中…", ko: "작업을 불러오는 중…", de: "Aufgaben werden geladen…",
    fr: "Chargement des tâches…", es: "Cargando tareas…", pt: "Carregando tarefas…", th: "กำลังโหลดงาน…",
    id: "Memuat tugas…", tr: "Görevler yükleniyor…", ru: "Загрузка задач…", ar: "جارٍ تحميل المهام…",
  },
  "当前宿主未提供定时任务能力:请在宿主设置中启用定时任务插件后重试(0.1.7 起默认为关闭)。": {
    "zh-tw": "目前主機未提供定時任務能力:請在主機設定中啟用定時任務外掛後重試(0.1.7 起預設為關閉)。",
    ja: "現在のホストはスケジュール機能を提供していません:ホスト設定でスケジュールプラグインを有効にしてから再試行してください(0.1.7 以降は既定で無効)。",
    ko: "현재 호스트가 예약 작업 기능을 제공하지 않습니다. 호스트 설정에서 예약 작업 플러그인을 활성화한 뒤 다시 시도하세요(0.1.7부터 기본 비활성).",
    de: "Der aktuelle Host bietet keine geplanten Aufgaben: Aktivieren Sie das Aufgaben-Plugin in den Host-Einstellungen und versuchen Sie es erneut (ab 0.1.7 standardmäßig deaktiviert).",
    fr: "L'hôte actuel ne fournit pas les tâches planifiées : activez le plugin correspondant dans les réglages de l'hôte puis réessayez (désactivé par défaut depuis 0.1.7).",
    es: "El host actual no ofrece tareas programadas: activa el plugin de tareas en los ajustes del host y vuelve a intentarlo (desde 0.1.7 está desactivado por defecto).",
    pt: "O host atual não oferece tarefas agendadas: ative o plugin de tarefas nas configurações do host e tente novamente (desde 0.1.7 vem desativado).",
    th: "โฮสต์ปัจจุบันไม่มีความสามารถงานตามกำหนดเวลา: เปิดปลั๊กอินงานตามกำหนดเวลาในการตั้งค่าโฮสต์แล้วลองใหม่ (ตั้งแต่ 0.1.7 ปิดไว้เป็นค่าเริ่มต้น)",
    id: "Host saat ini tidak menyediakan tugas terjadwal: aktifkan plugin tugas terjadwal di pengaturan host lalu coba lagi (sejak 0.1.7 nonaktif secara bawaan).",
    tr: "Geçerli ana makine zamanlanmış görevleri sunmuyor: ana makine ayarlarından zamanlanmış görev eklentisini etkinleştirip yeniden deneyin (0.1.7'den beri varsayılan olarak kapalı).",
    ru: "Текущий хост не предоставляет задачи по расписанию: включите соответствующий плагин в настройках хоста и повторите попытку (с 0.1.7 отключено по умолчанию).",
    ar: "المضيف الحالي لا يوفّر المهام المجدولة: فعِّل إضافة المهام المجدولة في إعدادات المضيف ثم أعد المحاولة (معطّلة افتراضيًا منذ 0.1.7).",
  },
  "还没有自动化任务,在会话中创建的任务会显示在这里": {
    "zh-tw": "還沒有自動化任務,在對話中建立的任務會顯示在這裡",
    ja: "自動化タスクはまだありません。セッションで作成したタスクがここに表示されます。",
    ko: "아직 자동화 작업이 없습니다. 세션에서 만든 작업이 여기에 표시됩니다.",
    de: "Noch keine automatisierten Aufgaben. In Sitzungen erstellte Aufgaben erscheinen hier.",
    fr: "Aucune tâche automatisée pour l'instant. Les tâches créées dans vos sessions apparaîtront ici.",
    es: "Aún no hay tareas automatizadas. Las tareas creadas en tus sesiones aparecerán aquí.",
    pt: "Ainda não há tarefas automatizadas. As tarefas criadas nas sessões aparecerão aqui.",
    th: "ยังไม่มีงานอัตโนมัติ งานที่สร้างในเซสชันจะแสดงที่นี่",
    id: "Belum ada tugas otomatis. Tugas yang dibuat dalam sesi akan muncul di sini.",
    tr: "Henüz otomatik görev yok. Oturumlarınızda oluşturulan görevler burada görünür.",
    ru: "Автоматических задач пока нет. Задачи, созданные в сессиях, появятся здесь.",
    ar: "لا توجد مهام آلية بعد. ستظهر هنا المهام المُنشأة في الجلسات.",
  },
  "没有匹配的自动化任务": {
    "zh-tw": "沒有符合的自動化任務", ja: "一致する自動化タスクはありません", ko: "일치하는 자동화 작업이 없습니다",
    de: "Keine passenden automatisierten Aufgaben", fr: "Aucune tâche automatisée correspondante",
    es: "No hay tareas automatizadas coincidentes", pt: "Nenhuma tarefa automatizada correspondente",
    th: "ไม่มีงานอัตโนมัติที่ตรงกัน", id: "Tidak ada tugas otomatis yang cocok",
    tr: "Eşleşen otomatik görev yok", ru: "Подходящих автоматических задач нет", ar: "لا توجد مهام آلية مطابقة",
  },
  "下次计划时间:": {
    "zh-tw": "下次排程時間:", ja: "次回予定時刻:", ko: "다음 예정 시간:", de: "Nächster geplanter Zeitpunkt:",
    fr: "Prochaine exécution :", es: "Próxima ejecución:", pt: "Próxima execução:", th: "เวลาที่กำหนดถัดไป:",
    id: "Waktu terjadwal berikutnya:", tr: "Sonraki planlanan zaman:", ru: "Следующее плановое время:", ar: "الوقت المجدول التالي:",
  },
  "关联会话": {
    "zh-tw": "關聯對話", ja: "関連セッション", ko: "연결된 세션", de: "Verknüpfte Sitzung",
    fr: "Session liée", es: "Sesión vinculada", pt: "Sessão vinculada", th: "เซสชันที่เชื่อมโยง",
    id: "Sesi tertaut", tr: "Bağlı oturum", ru: "Связанная сессия", ar: "الجلسة المرتبطة",
  },
  "状态": {
    "zh-tw": "狀態", ja: "状態", ko: "상태", de: "Status",
    fr: "État", es: "Estado", pt: "Status", th: "สถานะ",
    id: "Status", tr: "Durum", ru: "Состояние", ar: "الحالة",
  },
  "下次计划时间": {
    "zh-tw": "下次排程時間", ja: "次回予定時刻", ko: "다음 예정 시간", de: "Nächster geplanter Zeitpunkt",
    fr: "Prochaine exécution", es: "Próxima ejecución", pt: "Próxima execução", th: "เวลาที่กำหนดถัดไป",
    id: "Waktu terjadwal berikutnya", tr: "Sonraki planlanan zaman", ru: "Следующее плановое время", ar: "الوقت المجدول التالي",
  },
  "提醒频率": {
    "zh-tw": "提醒頻率", ja: "リマインダー頻度", ko: "알림 빈도", de: "Erinnerungshäufigkeit",
    fr: "Fréquence du rappel", es: "Frecuencia del recordatorio", pt: "Frequência do lembrete", th: "ความถี่การเตือน",
    id: "Frekuensi pengingat", tr: "Hatırlatma sıklığı", ru: "Частота напоминания", ar: "تكرار التذكير",
  },
  "时区": {
    "zh-tw": "時區", ja: "タイムゾーン", ko: "시간대", de: "Zeitzone",
    fr: "Fuseau horaire", es: "Zona horaria", pt: "Fuso horário", th: "เขตเวลา",
    id: "Zona waktu", tr: "Saat dilimi", ru: "Часовой пояс", ar: "المنطقة الزمنية",
  },
  "最近一次投递": {
    "zh-tw": "最近一次投遞", ja: "最新の配信", ko: "최근 전달", de: "Letzte Zustellung",
    fr: "Dernière remise", es: "Última entrega", pt: "Última entrega", th: "การส่งล่าสุด",
    id: "Pengiriman terakhir", tr: "Son teslim", ru: "Последняя доставка", ar: "آخر تسليم",
  },
  "任务 ID": {
    "zh-tw": "任務 ID", ja: "タスク ID", ko: "작업 ID", de: "Aufgaben-ID",
    fr: "ID de la tâche", es: "ID de la tarea", pt: "ID da tarefa", th: "ID งาน",
    id: "ID tugas", tr: "Görev kimliği", ru: "Идентификатор задачи", ar: "معرّف المهمة",
  },
  "确认删除": {
    "zh-tw": "確認刪除", ja: "削除を確認", ko: "삭제 확인", de: "Löschen bestätigen",
    fr: "Confirmer la suppression", es: "Confirmar eliminación", pt: "Confirmar exclusão", th: "ยืนยันการลบ",
    id: "Konfirmasi hapus", tr: "Silmeyi onayla", ru: "Подтвердить удаление", ar: "تأكيد الحذف",
  },
  "删除任务": {
    "zh-tw": "刪除任務", ja: "タスクを削除", ko: "작업 삭제", de: "Aufgabe löschen",
    fr: "Supprimer la tâche", es: "Eliminar tarea", pt: "Excluir tarefa", th: "ลบงาน",
    id: "Hapus tugas", tr: "Görevi sil", ru: "Удалить задачу", ar: "حذف المهمة",
  },
  "删除此任务?": {
    "zh-tw": "刪除此任務?", ja: "このタスクを削除しますか?", ko: "이 작업을 삭제할까요?", de: "Diese Aufgabe löschen?",
    fr: "Supprimer cette tâche ?", es: "¿Eliminar esta tarea?", pt: "Excluir esta tarefa?", th: "ลบงานนี้หรือไม่?",
    id: "Hapus tugas ini?", tr: "Bu görev silinsin mi?", ru: "Удалить эту задачу?", ar: "حذف هذه المهمة؟",
  },
  "重新读取运行记录": {
    "zh-tw": "重新讀取執行記錄", ja: "実行記録を再読み込み", ko: "실행 기록 다시 읽기", de: "Ausführungsprotokolle neu laden",
    fr: "Recharger l'historique", es: "Recargar el historial", pt: "Recarregar o histórico", th: "โหลดประวัติการทำงานใหม่",
    id: "Muat ulang riwayat", tr: "Çalıştırma kayıtlarını yenile", ru: "Перечитать историю запусков", ar: "إعادة تحميل سجل التشغيل",
  },
  "关闭详情": {
    "zh-tw": "關閉詳情", ja: "詳細を閉じる", ko: "상세 닫기", de: "Details schließen",
    fr: "Fermer les détails", es: "Cerrar detalles", pt: "Fechar detalhes", th: "ปิดรายละเอียด",
    id: "Tutup detail", tr: "Ayrıntıları kapat", ru: "Закрыть подробности", ar: "إغلاق التفاصيل",
  },
  "收起任务详情": {
    "zh-tw": "收合任務詳情", ja: "タスク詳細を折りたたむ", ko: "작업 상세 접기", de: "Aufgabendetails einklappen",
    fr: "Replier les détails de la tâche", es: "Contraer los detalles de la tarea", pt: "Recolher os detalhes da tarefa",
    th: "ยุบรายละเอียดงาน", id: "Ciutkan detail tugas", tr: "Görev ayrıntılarını daralt",
    ru: "Свернуть подробности задачи", ar: "طيّ تفاصيل المهمة",
  },
  "任务运行记录": {
    "zh-tw": "任務執行記錄", ja: "タスク実行記録", ko: "작업 실행 기록", de: "Ausführungsprotokolle",
    fr: "Historique d'exécution", es: "Historial de ejecución", pt: "Histórico de execução", th: "ประวัติการทำงานของงาน",
    id: "Riwayat eksekusi tugas", tr: "Görev çalıştırma kayıtları", ru: "История запусков задачи", ar: "سجل تشغيل المهمة",
  },
  "正在加载任务运行记录…": {
    "zh-tw": "正在載入任務執行記錄…", ja: "実行記録を読み込み中…", ko: "실행 기록을 불러오는 중…", de: "Ausführungsprotokolle werden geladen…",
    fr: "Chargement de l'historique…", es: "Cargando el historial…", pt: "Carregando o histórico…", th: "กำลังโหลดประวัติการทำงาน…",
    id: "Memuat riwayat eksekusi…", tr: "Çalıştırma kayıtları yükleniyor…", ru: "Загрузка истории запусков…", ar: "جارٍ تحميل سجل التشغيل…",
  },
  "暂无任务运行记录": {
    "zh-tw": "暫無任務執行記錄", ja: "実行記録はありません", ko: "실행 기록이 없습니다", de: "Keine Ausführungsprotokolle vorhanden",
    fr: "Aucun historique d'exécution", es: "Sin historial de ejecución", pt: "Nenhum histórico de execução", th: "ยังไม่มีประวัติการทำงาน",
    id: "Belum ada riwayat eksekusi", tr: "Henüz çalıştırma kaydı yok", ru: "Истории запусков пока нет", ar: "لا يوجد سجل تشغيل بعد",
  },
  "无法加载任务运行记录": {
    "zh-tw": "無法載入任務執行記錄", ja: "実行記録を読み込めません", ko: "실행 기록을 불러올 수 없습니다", de: "Ausführungsprotokolle konnten nicht geladen werden",
    fr: "Impossible de charger l'historique", es: "No se pudo cargar el historial", pt: "Não foi possível carregar o histórico",
    th: "โหลดประวัติการทำงานไม่สำเร็จ", id: "Gagal memuat riwayat eksekusi", tr: "Çalıştırma kayıtları yüklenemedi",
    ru: "Не удалось загрузить историю запусков", ar: "تعذّر تحميل سجل التشغيل",
  },
  "更早的运行记录已清理": {
    "zh-tw": "更早的執行記錄已清理", ja: "古い実行記録は削除されました", ko: "이전 실행 기록이 정리되었습니다",
    de: "Ältere Ausführungsprotokolle wurden entfernt", fr: "Les enregistrements plus anciens ont été purgés",
    es: "Los registros anteriores se han depurado", pt: "Os registros mais antigos foram removidos",
    th: "ล้างบันทึกการทำงานก่อนหน้าออกแล้ว", id: "Riwayat yang lebih lama telah dibersihkan",
    tr: "Daha eski kayıtlar temizlendi", ru: "Более ранние записи очищены", ar: "تم مسح السجلات الأقدم",
  },
  "加载更多": {
    "zh-tw": "載入更多", ja: "さらに読み込む", ko: "더 불러오기", de: "Mehr laden",
    fr: "Charger plus", es: "Cargar más", pt: "Carregar mais", th: "โหลดเพิ่มเติม",
    id: "Muat lebih banyak", tr: "Daha fazla yükle", ru: "Загрузить ещё", ar: "تحميل المزيد",
  },
  "加载更早的运行记录": {
    "zh-tw": "載入更早的執行記錄", ja: "古い実行記録を読み込む", ko: "이전 실행 기록 불러오기", de: "Ältere Ausführungsprotokolle laden",
    fr: "Charger les enregistrements plus anciens", es: "Cargar registros anteriores", pt: "Carregar registros mais antigos",
    th: "โหลดบันทึกการทำงานก่อนหน้า", id: "Muat riwayat yang lebih lama", tr: "Daha eski kayıtları yükle",
    ru: "Загрузить более ранние записи", ar: "تحميل سجلات تشغيل أقدم",
  },
  "无法删除任务": {
    "zh-tw": "無法刪除任務", ja: "タスクを削除できません", ko: "작업을 삭제할 수 없습니다", de: "Aufgabe konnte nicht gelöscht werden",
    fr: "Impossible de supprimer la tâche", es: "No se pudo eliminar la tarea", pt: "Não foi possível excluir a tarefa",
    th: "ลบงานไม่สำเร็จ", id: "Gagal menghapus tugas", tr: "Görev silinemedi", ru: "Не удалось удалить задачу", ar: "تعذّر حذف المهمة",
  },
  "任务可能已不存在": {
    "zh-tw": "任務可能已不存在", ja: "タスクは既に存在しない可能性があります", ko: "작업이 이미 없을 수 있습니다",
    de: "Die Aufgabe existiert möglicherweise nicht mehr", fr: "La tâche n'existe peut-être plus",
    es: "Es posible que la tarea ya no exista", pt: "A tarefa pode não existir mais",
    th: "งานนี้อาจไม่มีอยู่แล้ว", id: "Tugas mungkin sudah tidak ada", tr: "Görev artık mevcut olmayabilir",
    ru: "Возможно, задачи больше нет", ar: "قد تكون المهمة لم تعد موجودة",
  },
  "当前宿主的预设由 Cordis 组合声明,不再提供本地预设作者端点(复制 / 打开目录 / 删除);此处只能查看组合文本。": {
    "zh-tw": "目前主機的預設由 Cordis 組合宣告,不再提供本機預設作者端點(複製 / 開啟目錄 / 刪除);此處僅能檢視組合文字。",
    ja: "現在のホストのプリセットは Cordis 構成で宣言され、ローカルなプリセット作成エンドポイント(複製 / フォルダを開く / 削除)は提供されません。ここでは構成テキストの閲覧のみ可能です。",
    ko: "현재 호스트의 프리셋은 Cordis 구성으로 선언되며, 로컬 프리셋 작성 엔드포인트(복사 / 폴더 열기 / 삭제)는 더 이상 제공되지 않습니다. 여기서는 구성 텍스트만 볼 수 있습니다.",
    de: "Die Presets des aktuellen Hosts werden per Cordis-Komposition deklariert; lokale Preset-Authoring-Endpunkte (Kopieren / Ordner öffnen / Löschen) entfallen. Hier lässt sich nur der Kompositionstext ansehen.",
    fr: "Les préréglages de l'hôte actuel sont déclarés par composition Cordis ; les points d'accès d'édition locale (copier / ouvrir le dossier / supprimer) ne sont plus fournis. Seul le texte de composition est consultable ici.",
    es: "Los preajustes del host actual se declaran mediante composición de Cordis; ya no se ofrecen endpoints de edición local (copiar / abrir carpeta / eliminar). Aquí solo puede consultarse el texto de composición.",
    pt: "Os presets do host atual são declarados por composição do Cordis; os endpoints de edição local (copiar / abrir pasta / excluir) não são mais oferecidos. Aqui só é possível ver o texto de composição.",
    th: "พรีเซ็ตของโฮสต์ปัจจุบันประกาศผ่านองค์ประกอบ Cordis จึงไม่มีปลายทางการแก้ไขพรีเซ็ตในเครื่อง (คัดลอก / เปิดโฟลเดอร์ / ลบ) อีกต่อไป ที่นี่ดูได้เฉพาะข้อความองค์ประกอบ",
    id: "Praset host saat ini dideklarasikan melalui komposisi Cordis; endpoint penulisan praset lokal (salin / buka folder / hapus) tidak lagi tersedia. Di sini hanya teks komposisi yang bisa dilihat.",
    tr: "Geçerli ana makinenin ön ayarları Cordis bileşimiyle bildirilir; yerel ön ayar yazma uç noktaları (kopyala / klasörü aç / sil) artık sunulmuyor. Burada yalnızca bileşim metni görüntülenebilir.",
    ru: "Пресеты текущего хоста объявляются композицией Cordis; локальные точки записи пресетов (копировать / открыть папку / удалить) больше не предоставляются. Здесь доступен только просмотр текста композиции.",
    ar: "إعدادات المضيف الحالي تُعلَن عبر تركيب Cordis؛ لم تعد نقاط كتابة الإعدادات المحلية (نسخ / فتح المجلد / حذف) متاحة. هنا يمكن عرض نص التركيب فقط.",
  },
  "旧会话无法撤销反馈": {
    "zh-tw": "舊對話無法撤銷回饋", ja: "古いセッションではフィードバックを取り消せません", ko: "이전 세션에서는 피드백을 취소할 수 없습니다",
    de: "In älteren Sitzungen kann Feedback nicht zurückgenommen werden", fr: "Impossible d'annuler le retour dans les anciennes sessions",
    es: "En sesiones antiguas no se puede anular el comentario", pt: "Em sessões antigas não é possível desfazer o feedback",
    th: "เซสชันเก่าไม่สามารถยกเลิกความคิดเห็นได้", id: "Sesi lama tidak dapat membatalkan umpan balik",
    tr: "Eski oturumlarda geri bildirim geri alınamaz", ru: "В старых сессиях отзыв отменить нельзя", ar: "لا يمكن إلغاء الملاحظات في الجلسات القديمة",
  },
};

/** l10n 键 → 各语言译文(zh-cn / zh-tw / en 由脚本按中文源串/英文源串写入)。 */
const L10N_EN = {
  "notice.feedbackConflict": "Feedback changed elsewhere; the latest value has been reloaded. Please rate again.",
  "notice.feedbackFailed": "Could not record feedback: {error}",
  "notice.presetAuthoringGone": "This host declares presets through Cordis composition and no longer provides local preset authoring (copy / delete / open folder). Composition text can still be viewed in Settings.",
};
const L10N_ZH = {
  "notice.feedbackConflict": "反馈已被其他界面修改,已重新载入最新值;请重新评价。",
  "notice.feedbackFailed": "记录反馈失败: {error}",
  "notice.presetAuthoringGone": "该宿主的预设由 Cordis 组合声明,不再提供本地预设作者能力(复制 / 删除 / 打开目录);仍可在设置中查看组合文本。",
};
const L10N_ZH_TW = {
  "notice.feedbackConflict": "回饋已被其他介面修改,已重新載入最新值;請重新評價。",
  "notice.feedbackFailed": "記錄回饋失敗: {error}",
  "notice.presetAuthoringGone": "此主機的預設由 Cordis 組合宣告,不再提供本機預設作者能力(複製 / 刪除 / 開啟目錄);仍可在設定中檢視組合文字。",
};
const L10N_KEYS = {
  "notice.feedbackConflict": {
    ja: "フィードバックは別の画面で変更されました。最新の値を読み込み直しました。もう一度評価してください。",
    ko: "다른 화면에서 피드백이 변경되었습니다. 최신 값을 다시 불러왔으니 다시 평가해 주세요.",
    de: "Das Feedback wurde an anderer Stelle geändert; der aktuelle Wert wurde neu geladen. Bitte erneut bewerten.",
    fr: "Le retour a été modifié ailleurs ; la valeur la plus récente a été rechargée. Veuillez réévaluer.",
    es: "El comentario cambió en otro lugar; se recargó el valor más reciente. Vuelve a valorarlo.",
    pt: "O feedback foi alterado em outro lugar; o valor mais recente foi recarregado. Avalie novamente.",
    th: "ความคิดเห็นถูกแก้ไขจากที่อื่น ระบบโหลดค่าใหม่แล้ว กรุณาให้คะแนนอีกครั้ง",
    id: "Umpan balik diubah di tempat lain; nilai terbaru telah dimuat ulang. Silakan menilai lagi.",
    tr: "Geri bildirim başka bir yerde değiştirildi; en güncel değer yeniden yüklendi. Lütfen yeniden değerlendirin.",
    ru: "Отзыв изменён в другом интерфейсе; последнее значение перезагружено. Оцените заново.",
    ar: "تم تغيير الملاحظات من واجهة أخرى؛ أُعيد تحميل أحدث قيمة. يرجى التقييم مرة أخرى.",
  },
  "notice.feedbackFailed": {
    ja: "フィードバックを記録できませんでした: {error}",
    ko: "피드백을 기록하지 못했습니다: {error}",
    de: "Feedback konnte nicht erfasst werden: {error}",
    fr: "Impossible d'enregistrer le retour : {error}",
    es: "No se pudo registrar el comentario: {error}",
    pt: "Não foi possível registrar o feedback: {error}",
    th: "บันทึกความคิดเห็นไม่สำเร็จ: {error}",
    id: "Gagal mencatat umpan balik: {error}",
    tr: "Geri bildirim kaydedilemedi: {error}",
    ru: "Не удалось записать отзыв: {error}",
    ar: "تعذّر تسجيل الملاحظات: {error}",
  },
  "notice.presetAuthoringGone": {
    ja: "このホストのプリセットは Cordis 構成で宣言されており、ローカルなプリセット作成機能(複製 / 削除 / フォルダを開く)は提供されません。構成テキストは設定で確認できます。",
    ko: "이 호스트의 프리셋은 Cordis 구성으로 선언되어 로컬 프리셋 작성 기능(복사 / 삭제 / 폴더 열기)을 제공하지 않습니다. 구성 텍스트는 설정에서 확인할 수 있습니다.",
    de: "Die Presets dieses Hosts werden per Cordis-Komposition deklariert; lokales Preset-Authoring (Kopieren / Löschen / Ordner öffnen) entfällt. Der Kompositionstext bleibt in den Einstellungen einsehbar.",
    fr: "Les préréglages de cet hôte sont déclarés par composition Cordis ; l'édition locale (copier / supprimer / ouvrir le dossier) n'est plus fournie. Le texte de composition reste consultable dans les réglages.",
    es: "Los preajustes de este host se declaran por composición de Cordis; ya no se ofrece edición local (copiar / eliminar / abrir carpeta). El texto de composición sigue consultable en Ajustes.",
    pt: "Os presets deste host são declarados por composição do Cordis; a edição local (copiar / excluir / abrir pasta) não é mais oferecida. O texto de composição continua visível nas configurações.",
    th: "พรีเซ็ตของโฮสต์นี้ประกาศผ่านองค์ประกอบ Cordis จึงไม่มีฟังก์ชันแก้ไขพรีเซ็ตในเครื่อง (คัดลอก / ลบ / เปิดโฟลเดอร์) ยังดูข้อความองค์ประกอบได้ในการตั้งค่า",
    id: "Praset host ini dideklarasikan melalui komposisi Cordis; penulisan praset lokal (salin / hapus / buka folder) tidak lagi tersedia. Teks komposisi masih dapat dilihat di Pengaturan.",
    tr: "Bu ana makinenin ön ayarları Cordis bileşimiyle bildirilir; yerel ön ayar yazma (kopyala / sil / klasörü aç) artık sunulmuyor. Bileşim metni Ayarlar'da görülebilir.",
    ru: "Пресеты этого хоста объявляются композицией Cordis; локальное редактирование (копировать / удалить / открыть папку) больше не предоставляется. Текст композиции по-прежнему доступен в настройках.",
    ar: "إعدادات هذا المضيف تُعلَن عبر تركيب Cordis؛ لم تعد كتابة الإعدادات المحلية (نسخ / حذف / فتح المجلد) متاحة. يبقى نص التركيب متاحًا في الإعدادات.",
  },
};

/** 带占位符的键(校验脚本跳过,但非中文界面仍需词典,否则回退中文源串)。 */
const WEBVIEW_PARAM_KEYS = {
  "{n} 小时": {
    "zh-tw": "{n} 小時", ja: "{n} 時間", ko: "{n}시간", de: "{n} Stunden",
    fr: "{n} heures", es: "{n} horas", pt: "{n} horas", th: "{n} ชั่วโมง",
    id: "{n} jam", tr: "{n} saat", ru: "{n} ч", ar: "{n} ساعات",
  },
  "{n} 分钟": {
    "zh-tw": "{n} 分鐘", ja: "{n} 分", ko: "{n}분", de: "{n} Minuten",
    fr: "{n} minutes", es: "{n} minutos", pt: "{n} minutos", th: "{n} นาที",
    id: "{n} menit", tr: "{n} dakika", ru: "{n} мин", ar: "{n} دقائق",
  },
  "{n} 秒": {
    "zh-tw": "{n} 秒", ja: "{n} 秒", ko: "{n}초", de: "{n} Sekunden",
    fr: "{n} secondes", es: "{n} segundos", pt: "{n} segundos", th: "{n} วินาที",
    id: "{n} detik", tr: "{n} saniye", ru: "{n} с", ar: "{n} ثوانٍ",
  },
  "一次性(创建后 {d})": {
    "zh-tw": "一次性(建立後 {d})", ja: "1 回のみ({d} 後)", ko: "1회({d} 후)", de: "Einmalig (nach {d})",
    fr: "Une fois (après {d})", es: "Una vez (tras {d})", pt: "Uma vez (após {d})", th: "ครั้งเดียว (อีก {d})",
    id: "Sekali ({d} lagi)", tr: "Bir kez ({d} sonra)", ru: "Однократно (через {d})", ar: "مرة واحدة (بعد {d})",
  },
  "每 {d}": {
    "zh-tw": "每 {d}", ja: "{d} ごと", ko: "{d}마다", de: "Alle {d}",
    fr: "Toutes les {d}", es: "Cada {d}", pt: "A cada {d}", th: "ทุก {d}",
    id: "Setiap {d}", tr: "Her {d}", ru: "Каждые {d}", ar: "كل {d}",
  },
  "每天 {time}": {
    "zh-tw": "每天 {time}", ja: "毎日 {time}", ko: "매일 {time}", de: "Täglich {time}",
    fr: "Tous les jours à {time}", es: "Cada día a las {time}", pt: "Todos os dias às {time}", th: "ทุกวัน {time}",
    id: "Setiap hari {time}", tr: "Her gün {time}", ru: "Ежедневно в {time}", ar: "يوميًا {time}",
  },
  "每周 {days} {time}": {
    "zh-tw": "每週 {days} {time}", ja: "毎週 {days} {time}", ko: "매주 {days} {time}", de: "Wöchentlich {days} {time}",
    fr: "Chaque semaine {days} à {time}", es: "Cada semana {days} a las {time}", pt: "Toda semana {days} às {time}",
    th: "ทุกสัปดาห์ {days} {time}", id: "Setiap minggu {days} {time}", tr: "Her hafta {days} {time}",
    ru: "Еженедельно {days} в {time}", ar: "أسبوعيًا {days} {time}",
  },
  "Cron {expr}": {
    "zh-tw": "Cron {expr}", ja: "Cron {expr}", ko: "Cron {expr}", de: "Cron {expr}",
    fr: "Cron {expr}", es: "Cron {expr}", pt: "Cron {expr}", th: "Cron {expr}",
    id: "Cron {expr}", tr: "Cron {expr}", ru: "Cron {expr}", ar: "Cron {expr}",
  },
  "{absolute}(已到期)": {
    "zh-tw": "{absolute}(已到期)", ja: "{absolute}(期限到来)", ko: "{absolute}(기한 도래)", de: "{absolute} (fällig)",
    fr: "{absolute} (échu)", es: "{absolute} (vencido)", pt: "{absolute} (vencido)", th: "{absolute} (ครบกำหนด)",
    id: "{absolute} (jatuh tempo)", tr: "{absolute} (zamanı geldi)", ru: "{absolute} (наступило)", ar: "{absolute} (حان الموعد)",
  },
  "{absolute}({relative}后)": {
    "zh-tw": "{absolute}({relative}後)", ja: "{absolute}({relative}後)", ko: "{absolute}({relative} 후)", de: "{absolute} (in {relative})",
    fr: "{absolute} (dans {relative})", es: "{absolute} (en {relative})", pt: "{absolute} (em {relative})",
    th: "{absolute} (อีก {relative})", id: "{absolute} (dalam {relative})", tr: "{absolute} ({relative} sonra)",
    ru: "{absolute} (через {relative})", ar: "{absolute} (بعد {relative})",
  },
  "{m}月{d}日 {clock}": {
    "zh-tw": "{m}月{d}日 {clock}", ja: "{m}月{d}日 {clock}", ko: "{m}월 {d}일 {clock}", de: "{d}.{m}. {clock}",
    fr: "{d}/{m} {clock}", es: "{d}/{m} {clock}", pt: "{d}/{m} {clock}", th: "{d}/{m} {clock}",
    id: "{d}/{m} {clock}", tr: "{d}.{m} {clock}", ru: "{d}.{m} {clock}", ar: "{d}/{m} {clock}",
  },
  "{y}年{m}月{d}日 {clock}": {
    "zh-tw": "{y}年{m}月{d}日 {clock}", ja: "{y}年{m}月{d}日 {clock}", ko: "{y}년 {m}월 {d}일 {clock}", de: "{d}.{m}.{y} {clock}",
    fr: "{d}/{m}/{y} {clock}", es: "{d}/{m}/{y} {clock}", pt: "{d}/{m}/{y} {clock}", th: "{d}/{m}/{y} {clock}",
    id: "{d}/{m}/{y} {clock}", tr: "{d}.{m}.{y} {clock}", ru: "{d}.{m}.{y} {clock}", ar: "{d}/{m}/{y} {clock}",
  },
  "、": {
    "zh-tw": "、", ja: "、", ko: ", ", de: ", ",
    fr: ", ", es: ", ", pt: ", ", th: ", ",
    id: ", ", tr: ", ", ru: ", ", ar: "، ",
  },
};

let webviewAdded = 0;
const textsDir = path.join(root, "src/webview/texts");
for (const file of fs.readdirSync(textsDir)) {
  if (!file.endsWith(".json")) continue;
  const lang = file.replace(/\.json$/, "");
  const full = path.join(textsDir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const [key, byLang] of Object.entries({ ...WEBVIEW_KEYS, ...WEBVIEW_PARAM_KEYS })) {
    if (dict[key] === undefined && byLang[lang] !== undefined) {
      dict[key] = byLang[lang];
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    webviewAdded++;
  }
}

let l10nAdded = 0;
const l10nDir = path.join(root, "l10n");
for (const file of fs.readdirSync(l10nDir)) {
  if (!/^bundle\.l10n\.json$/.test(file) && !/^bundle\.l10n\..*\.json$/.test(file)) continue;
  const lang = file === "bundle.l10n.json" ? "en" : file.replace(/^bundle\.l10n\./, "").replace(/\.json$/, "");
  const full = path.join(l10nDir, file);
  const dict = JSON.parse(fs.readFileSync(full, "utf8"));
  let changed = false;
  for (const key of Object.keys(L10N_EN)) {
    if (dict[key] !== undefined) continue;
    const value =
      lang === "en" ? L10N_EN[key] : lang === "zh-cn" ? L10N_ZH[key] : lang === "zh-tw" ? L10N_ZH_TW[key] : L10N_KEYS[key][lang];
    if (value === undefined) continue;
    dict[key] = value;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(full, `${JSON.stringify(dict, null, 2)}\n`, "utf8");
    l10nAdded++;
  }
}

console.log(`webview dictionaries updated: ${webviewAdded}`);
console.log(`l10n bundles updated: ${l10nAdded}`);
