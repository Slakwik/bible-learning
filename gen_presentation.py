#!/usr/bin/env python3
"""Generate Bible Study presentation as PDF slides."""

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

W, H = landscape(A4)

# Colors
PRIMARY_DARK = HexColor('#1a3d1b')
PRIMARY = HexColor('#2c5f2d')
PRIMARY_LIGHT = HexColor('#4a8c4b')
ACCENT = HexColor('#c9a227')
BG = HexColor('#faf8f0')
TEXT = HexColor('#2d2d2d')
TEXT_LIGHT = HexColor('#6b6b6b')
WHITE = white
CARD_BG = HexColor('#ffffff')
BORDER = HexColor('#e0ddd4')

# Try to use a font that supports Cyrillic
FONT = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'

# Check for DejaVu (common on Linux, supports Cyrillic)
dejavu_paths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
]
dejavu_bold_paths = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
]

for p in dejavu_paths:
    if os.path.exists(p):
        pdfmetrics.registerFont(TTFont('DejaVu', p))
        FONT = 'DejaVu'
        break

for p in dejavu_bold_paths:
    if os.path.exists(p):
        pdfmetrics.registerFont(TTFont('DejaVuBold', p))
        FONT_BOLD = 'DejaVuBold'
        break


def draw_bg(c, color=BG):
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def draw_gradient_bg(c, color1=PRIMARY_DARK, color2=PRIMARY, steps=60):
    for i in range(steps):
        t = i / steps
        r = color1.red + (color2.red - color1.red) * t
        g = color1.green + (color2.green - color1.green) * t
        b = color1.blue + (color2.blue - color1.blue) * t
        c.setFillColor(Color(r, g, b))
        y = H - (H / steps) * i
        c.rect(0, y - H / steps, W, H / steps + 1, fill=1, stroke=0)


def draw_footer(c, num, total, light=False):
    col = Color(1, 1, 1, 0.4) if light else TEXT_LIGHT
    c.setFillColor(col)
    c.setFont(FONT, 9)
    c.drawRightString(W - 40, 24, f'{num} / {total}')
    if not light:
        c.drawString(40, 24, 'Изучение Библии')


def draw_title(c, text, x, y, size=36, color=PRIMARY_DARK, font=None):
    c.setFillColor(color)
    c.setFont(font or FONT_BOLD, size)
    c.drawString(x, y, text)


def draw_text(c, text, x, y, size=16, color=TEXT, font=None, max_width=None):
    c.setFillColor(color)
    c.setFont(font or FONT, size)
    if max_width:
        words = text.split(' ')
        line = ''
        for word in words:
            test = line + ' ' + word if line else word
            if c.stringWidth(test, font or FONT, size) > max_width:
                c.drawString(x, y, line)
                y -= size * 1.5
                line = word
            else:
                line = test
        if line:
            c.drawString(x, y, line)
        return y
    else:
        c.drawString(x, y, text)
        return y


def draw_bullet(c, text, x, y, size=15, color=TEXT, bullet_color=ACCENT, max_width=600):
    c.setFillColor(bullet_color)
    c.setFont(FONT, size)
    c.drawString(x, y, '\u2666')  # diamond
    c.setFillColor(color)
    c.setFont(FONT, size)
    words = text.split(' ')
    line = ''
    first = True
    bx = x + 20
    for word in words:
        test = line + ' ' + word if line else word
        if c.stringWidth(test, FONT, size) > max_width:
            c.drawString(bx, y, line)
            y -= size * 1.6
            line = word
        else:
            line = test
    if line:
        c.drawString(bx, y, line)
    return y - size * 1.6


def draw_card(c, x, y, w, h, title, subtitle, bg_color=PRIMARY):
    # Card background
    c.setFillColor(bg_color)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=0)
    # Title
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 14)
    c.drawString(x + 16, y + h - 28, title)
    # Subtitle
    c.setFillColor(Color(1, 1, 1, 0.8))
    c.setFont(FONT, 11)
    c.drawString(x + 16, y + h - 46, subtitle)


def draw_highlight(c, text, x, y, width=650, size=14):
    c.setFillColor(HexColor('#f0ebe0'))
    c.roundRect(x, y - 10, width, 50, 6, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(x, y - 10, 4, 50, fill=1, stroke=0)
    c.setFillColor(TEXT)
    c.setFont(FONT, size)
    c.drawString(x + 16, y + 12, text)


TOTAL = 11

def make_pdf(filename):
    c = canvas.Canvas(filename, pagesize=landscape(A4))
    c.setTitle('Изучение Библии — Презентация')

    # ===== Slide 1: Title =====
    draw_gradient_bg(c)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 48)
    c.drawCentredString(W/2, H/2 + 60, 'Изучение Библии')
    c.setFont(FONT, 20)
    c.setFillColor(Color(1,1,1,0.85))
    c.drawCentredString(W/2, H/2 + 10, 'Онлайн-платформа для совместного изучения')
    c.drawCentredString(W/2, H/2 - 16, 'Священного Писания')
    c.setFont(FONT, 14)
    c.setFillColor(Color(1,1,1,0.6))
    c.drawCentredString(W/2, H/2 - 70, 'Домашние группы  \u00b7  Воскресные школы  \u00b7  Индивидуальное изучение')
    draw_footer(c, 1, TOTAL, light=True)
    c.showPage()

    # ===== Slide 2: For whom =====
    draw_bg(c)
    draw_title(c, 'Для кого эта платформа?', 60, H - 90, size=32)
    y = H - 150
    items = [
        'Домашние группы по изучению Библии',
        'Воскресные школы для взрослых',
        'Индивидуальное изучение Священного Писания',
        'Подготовка к групповым встречам и обсуждениям',
        'Ученики, которые хотят сохранять свои размышления',
    ]
    for item in items:
        y = draw_bullet(c, item, 80, y, max_width=650)
    draw_footer(c, 2, TOTAL)
    c.showPage()

    # ===== Slide 3: What we offer =====
    draw_bg(c)
    draw_title(c, 'Что мы предлагаем', 60, H - 90, size=32)

    # Left column
    c.setFillColor(PRIMARY)
    c.setFont(FONT_BOLD, 16)
    c.drawString(80, H - 150, 'Для учеников')
    y = H - 185
    for item in [
        'Структурированные уроки онлайн',
        'Вопросы для размышления в каждом уроке',
        'Ответы сохраняются автоматически',
        'Просмотр и печать своих ответов',
        'Отметки пройденных уроков',
    ]:
        y = draw_bullet(c, item, 80, y, size=13, max_width=300)

    # Right column
    c.setFillColor(PRIMARY)
    c.setFont(FONT_BOLD, 16)
    c.drawString(W/2 + 20, H - 150, 'Для преподавателей')
    y = H - 185
    for item in [
        'Панель управления учениками',
        'Просмотр ответов каждого ученика',
        'Статистика по прохождению уроков',
        'Форма записи новых учеников',
        'Добавление новых курсов',
    ]:
        y = draw_bullet(c, item, W/2 + 20, y, size=13, max_width=300)

    draw_footer(c, 3, TOTAL)
    c.showPage()

    # ===== Slide 4: Courses =====
    draw_bg(c)
    draw_title(c, 'Доступные курсы', 60, H - 90, size=32)

    courses = [
        ('Послание Иакова', '6 уроков', 'Вера и дела', PRIMARY),
        ('Послание к Ефесянам', '6 уроков', 'Позиция во Христе', HexColor('#3a4a7a')),
        ('Послание к Галатам', '6 уроков', 'Свобода во Христе', HexColor('#7a4a3a')),
        ('Послание к Филиппийцам', '6 уроков', 'Радость в Господе', HexColor('#5a3a7a')),
        ('Мудрость Соломона', '12 уроков', 'Притчи, Екклесиаст, Песнь Песней', HexColor('#6a6a2a')),
        ('Жизнь христианина', '12 уроков', 'Филимону, 1-3 Иоанна, Иуды', HexColor('#2a6a5a')),
        ('Второзаконие', '12 уроков', 'Второзаконие 1-34', HexColor('#4a3a6a')),
        ('Евангелие от Марка', '18 уроков', 'Марк 1-16', HexColor('#3a6a4a')),
        ('Бытие (часть 1)', '15 уроков', 'Быт. 1-25', HexColor('#7a4a3a')),
        ('Бытие (часть 2)', '15 уроков', 'Быт. 25-50', HexColor('#8a5a4a')),
        ('Иисус Навин', '6 уроков', 'Нав. 1-24', HexColor('#3a5a7a')),
        ('Амос и Исаия', '15 уроков', 'Амос, Исаия', HexColor('#5a4a2a')),
        ('Даниил', '12 уроков', 'Дан. 1-12', HexColor('#4a3a5a')),
        ('Деяния (часть 1)', '15 уроков', 'Деян. 1-15', HexColor('#3a6a7a')),
        ('Деяния (часть 2)', '15 уроков', 'Деян. 15-28', HexColor('#2a6a6a')),
        ('1 Коринфянам', '17 уроков', '1 Кор. 1-16', HexColor('#6a3a4a')),
        ('2 Коринфянам', '12 уроков', '2 Кор. 1-13', HexColor('#7a3a4a')),
        ('1-2 Фессалоникийцам', '6 уроков', '1-2 Фесс.', HexColor('#5a5a2a')),
        ('Послание 1 Иоанна', '6 уроков', '1 Ин. 1-5', HexColor('#2a5a4a')),
        ('Если будете молиться', '8 уроков', 'Молитва', HexColor('#4a4a7a')),
        ('Библия: Божья удивительная книга', '7 уроков', 'Обзор Библии', HexColor('#3a4a5a')),
    ]

    # Two columns with 11/10 courses each
    mid = (len(courses) + 1) // 2
    col1 = courses[:mid]
    col2 = courses[mid:]
    row_h = 38
    top_y = H - 130
    for col_courses, x0 in [(col1, 60), (col2, W / 2 + 20)]:
        y = top_y
        for name, count, desc, color in col_courses:
            c.setFillColor(color)
            c.roundRect(x0, y - 4, 6, 28, 3, fill=1, stroke=0)
            c.setFillColor(TEXT)
            c.setFont(FONT_BOLD, 12)
            c.drawString(x0 + 16, y + 10, name)
            c.setFillColor(TEXT_LIGHT)
            c.setFont(FONT, 10)
            c.drawString(x0 + 16, y - 4, f'{count}  \u00b7  {desc}')
            y -= row_h

    # Stats row at bottom — inline label:num pairs, compact
    c.setFont(FONT_BOLD, 18)
    c.setFillColor(PRIMARY)
    stat_text = '21 курс  \u00b7  227 уроков  \u00b7  3000+ вопросов'
    c.drawCentredString(W / 2, 55, stat_text)

    draw_footer(c, 4, TOTAL)
    c.showPage()

    # ===== Slide 5: Section - Student journey =====
    draw_gradient_bg(c, PRIMARY, PRIMARY_LIGHT)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 36)
    c.drawCentredString(W/2, H/2 + 20, 'Как это работает')
    c.setFont(FONT, 18)
    c.setFillColor(Color(1,1,1,0.7))
    c.drawCentredString(W/2, H/2 - 20, 'Путь ученика от записи до обсуждения')
    draw_footer(c, 5, TOTAL, light=True)
    c.showPage()

    # ===== Slide 6: User flow =====
    draw_bg(c)
    draw_title(c, 'Путь ученика', 60, H - 90, size=32)
    y = H - 150
    steps = [
        ('1.', 'Записаться на курс через форму на сайте'),
        ('2.', 'Получить учётную запись от администратора'),
        ('3.', 'Войти на платформу'),
        ('4.', 'Выбрать курс из каталога'),
        ('5.', 'Читать уроки и отвечать на вопросы'),
        ('6.', 'Просмотреть или распечатать свои ответы'),
        ('7.', 'Обсудить на групповой встрече'),
    ]
    for num, text in steps:
        c.setFillColor(ACCENT)
        c.setFont(FONT_BOLD, 15)
        c.drawString(80, y, num)
        c.setFillColor(TEXT)
        c.setFont(FONT, 15)
        c.drawString(110, y, text)
        y -= 36

    draw_footer(c, 6, TOTAL)
    c.showPage()

    # ===== Slide 7: Lesson structure =====
    draw_bg(c)
    draw_title(c, 'Структура урока', 60, H - 90, size=32)
    y = H - 150
    items = [
        'Введение и контекст изучаемого отрывка',
        'Текст комментария с пояснениями',
        'Вопросы для самостоятельного размышления',
        'Поля для записи ответов (автосохранение)',
        'Разделы «Познайте истину» и «Примените истину»',
        'Навигация между уроками курса',
    ]
    for item in items:
        y = draw_bullet(c, item, 80, y, max_width=650)

    draw_highlight(c, 'Каждый урок содержит вопросы и комментарии из оригинальных учебных материалов.', 80, y - 20, width=680)

    draw_footer(c, 7, TOTAL)
    c.showPage()

    # ===== Slide 8: My Answers =====
    draw_bg(c)
    draw_title(c, 'Мои ответы', 60, H - 90, size=32)
    c.setFillColor(TEXT)
    c.setFont(FONT, 16)
    y = H - 140
    y = draw_text(c, 'Каждый ученик может в любой момент просмотреть все свои ответы:', 80, y, max_width=700)
    y -= 20
    items = [
        'Выбор курса из списка',
        'Полный текст вопроса + ваш ответ',
        'Дата последнего сохранения',
        'Кнопка печати — чистый формат без лишних элементов',
        'Удобно для подготовки к групповой встрече',
    ]
    for item in items:
        y = draw_bullet(c, item, 80, y, max_width=650)

    draw_footer(c, 8, TOTAL)
    c.showPage()

    # ===== Slide 9: Admin =====
    draw_bg(c)
    draw_title(c, 'Панель администратора', 60, H - 90, size=32)

    c.setFillColor(PRIMARY)
    c.setFont(FONT_BOLD, 16)
    c.drawString(80, H - 150, 'Пользователи')
    y = H - 180
    for item in ['Добавление новых учеников', 'Редактирование и удаление', 'Назначение ролей']:
        y = draw_bullet(c, item, 80, y, size=13, max_width=300)

    c.setFillColor(PRIMARY)
    c.setFont(FONT_BOLD, 16)
    c.drawString(80, y - 10, 'Прогресс')
    y -= 40
    for item in ['Просмотр ответов каждого ученика', 'Фильтрация по курсам и урокам', 'Статистика прохождения']:
        y = draw_bullet(c, item, 80, y, size=13, max_width=300)

    c.setFillColor(PRIMARY)
    c.setFont(FONT_BOLD, 16)
    c.drawString(W/2 + 20, H - 150, 'Уроки')
    y = H - 180
    for item in ['Список всех уроков', 'Количество ответивших учеников', 'Быстрый переход к уроку']:
        y = draw_bullet(c, item, W/2 + 20, y, size=13, max_width=300)

    draw_footer(c, 9, TOTAL)
    c.showPage()

    # ===== Slide 10: Themes =====
    draw_bg(c)
    draw_title(c, 'Темы оформления', 60, H - 90, size=32)
    c.setFillColor(TEXT)
    c.setFont(FONT, 14)
    y = H - 130
    y = draw_text(c, 'Каждый ученик может выбрать удобный для себя визуальный стиль платформы.',
                  60, y, max_width=W - 120)
    y = draw_text(c, 'Выбор сохраняется в профиле и применяется на всех устройствах.',
                  60, y - 22, max_width=W - 120)

    # 4 theme preview cards
    cards = [
        ('Классика',  'Тёмно-синий, золото',          HexColor('#fafaf8'), HexColor('#1a365d'), HexColor('#c9963b')),
        ('Папирус',   'Кремовая бумага, вино',        HexColor('#f4efe2'), HexColor('#1a1714'), HexColor('#6b1f2c')),
        ('Очаг',      'Тёплая палитра, терракота',    HexColor('#faf6ef'), HexColor('#2a221a'), HexColor('#c66a4f')),
        ('Завет',     'Тёмная, янтарь',               HexColor('#0a0d18'), HexColor('#f3eee0'), HexColor('#f4c430')),
    ]
    cw = (W - 120 - 3 * 16) / 4   # card width
    cy = H - 230
    ch = 170
    for i, (name, desc, bg, fg, accent) in enumerate(cards):
        cx = 60 + i * (cw + 16)
        c.setFillColor(bg)
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.roundRect(cx, cy - ch, cw, ch, 10, fill=1, stroke=1)
        # Title with accent fragment
        c.setFillColor(fg)
        c.setFont(FONT_BOLD, 22)
        c.drawString(cx + 16, cy - 40, name)
        # Color stripe
        c.setFillColor(accent)
        c.rect(cx + 16, cy - 56, 56, 4, fill=1, stroke=0)
        # Description
        c.setFillColor(fg)
        c.setFont(FONT, 11)
        words = desc.split(' ')
        line = ''
        ty = cy - 80
        for w in words:
            test = (line + ' ' + w).strip()
            if c.stringWidth(test, FONT, 11) > cw - 32:
                c.drawString(cx + 16, ty, line)
                line = w
                ty -= 14
            else:
                line = test
        if line:
            c.drawString(cx + 16, ty, line)

    # Highlight at bottom
    draw_highlight(c,
        'По умолчанию (для гостей) тема задаётся в _config.yml. Авторизованный ученик меняет её в личном кабинете.',
        60, cy - ch - 45, width=W - 120)

    draw_footer(c, 10, TOTAL)
    c.showPage()

    # ===== Slide 11: End =====
    draw_gradient_bg(c)
    c.setFillColor(WHITE)
    c.setFont(FONT_BOLD, 40)
    c.drawCentredString(W/2, H/2 + 70, 'Изучение Библии')

    c.setFont(FONT, 15)
    c.setFillColor(Color(1,1,1,0.85))
    c.drawCentredString(W/2, H/2 + 10, '\u00ab\u0415\u0441\u043b\u0438 \u0436\u0435 \u0443 \u043a\u043e\u0433\u043e \u0438\u0437 \u0432\u0430\u0441 \u043d\u0435\u0434\u043e\u0441\u0442\u0430\u0435\u0442 \u043c\u0443\u0434\u0440\u043e\u0441\u0442\u0438, \u0434\u0430 \u043f\u0440\u043e\u0441\u0438\u0442 \u0443 \u0411\u043e\u0433\u0430,')
    c.drawCentredString(W/2, H/2 - 12, '\u0434\u0430\u044e\u0449\u0435\u0433\u043e \u0432\u0441\u0435\u043c \u043f\u0440\u043e\u0441\u0442\u043e \u0438 \u0431\u0435\u0437 \u0443\u043f\u0440\u0435\u043a\u043e\u0432, \u2014 \u0438 \u0434\u0430\u0441\u0442\u0441\u044f \u0435\u043c\u0443\u00bb')

    c.setFont(FONT, 11)
    c.setFillColor(Color(1,1,1,0.5))
    c.drawCentredString(W/2, H/2 - 40, '\u0418\u0430\u043a\u043e\u0432\u0430 1:5')

    c.setFont(FONT_BOLD, 20)
    c.setFillColor(WHITE)
    c.drawCentredString(W/2, H/2 - 90, '\u0421\u043f\u0430\u0441\u0438\u0431\u043e \u0437\u0430 \u0432\u043d\u0438\u043c\u0430\u043d\u0438\u0435!')

    draw_footer(c, 11, TOTAL, light=True)
    c.showPage()

    c.save()
    print(f'PDF saved: {filename}')


if __name__ == '__main__':
    make_pdf('/claude/slakwik-biblelearning/presentation.pdf')
