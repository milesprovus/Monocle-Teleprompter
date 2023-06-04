import touch
import display
import json
import led

led.off(led.RED)

with open('/mydata.json') as f:
   data = json.load(f)


index = 1

numOfSlides = len(data)
print(numOfSlides)
maxCharLength = 24

def main():
    display.CLEAR
    y = 0
    note_group = []
    for slide in data:
        slide_number = slide['slideNumber']
        notes = slide['notes']
        if slide_number == index:
            num = display.Text(f"{slide_number}", 640, 0, display.WHITE, justify=display.TOP_RIGHT)
            for note in notes:
                if len(note) > maxCharLength:
                    current_note = split_string(note, maxCharLength)
                    print(current_note)
                    firstStr = current_note[0]
                    secondStr = current_note[1]
                    print(firstStr)
                    print(secondStr)
                    firstStr = display.Text(f"{firstStr}", 0, y, display.WHITE)
                    y = y + 50
                    secondStr = display.Text(f"{secondStr}", 0, y, display.WHITE)
                    note_group.append(firstStr)
                    note_group.append(secondStr)
                    y = y + 50
                else:
                    current_note = display.Text(f"{note}", 0, y, display.WHITE)
                    note_group.append(current_note)
                    y = y + 50
            display.show(note_group, num)
            return {
                "slideNumber": slide_number,
                "notes": notes
            }

def nav(touch_input):
    if touch_input == touch.A:
        global index
        if index < len(data):
            index += 1
        print(index)
        main()
    if touch_input == touch.B:
        global index
        if index > 0:
            index -= 1
        print(index)
        main()

def split_string(string, split_point):
    string1 = string[:split_point]
    string2 = string[split_point:]
    return string1, string2



touch.callback(touch.BOTH, nav)


main()