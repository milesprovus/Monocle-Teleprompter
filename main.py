import json
import display as d
import touch as t


with open('uploads/mydata.json') as f:
   data = json.load(f)


def main():
    index = 1
    found_slide = False

    for slide in data:
        slide_number = slide['slideNumber']
        notes = slide['notes']
        if slide_number == index:
            found_slide = True
            print(f"Slide Number: {slide_number}")
            for note in notes:
                print(f"Note: {note}")
            return {
                "slideNumber": slide_number,
                "notes": notes
            }
    if not found_slide:
        print("Invalid slide index")
    display()

current_slide_data = main()
notes = current_slide_data['notes']
slide_num = "slide: " + current_slide_data['slideNunber']

x = 5
y = 5
def display():
  for note in notes:
      slideDisplay = d.text(slide_num, 427, 0, 0xafafaf, justify=d.TOP_LEFT)
      notesDisplay = d.text(note, x, y, d.WHITE, d.MIDDLE_LEFT)
      y = y + 10
      d.show(slideDisplay, notesDisplay)

def upSlide():
    index = index + 1
    main()

def downSlide():
    if index > 0:
      index = index - 1
    main()

t.callback(t.A, downSlide())
t.callback(t.B, upSlide())

print(current_slide_data)