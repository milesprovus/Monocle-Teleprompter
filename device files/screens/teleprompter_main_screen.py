# GENERATED BY BRILLIANT AR STUDIO Do not modify this file directly
import display as d
from main import main
class teleprompter_main:
	blocks=[
		d.Text(slide_num, 427, 0, 0xafafaf, justify=d.TOP_LEFT),
	]## dont't remove this #
	def __init__(self):
		d.show(self.blocks)

def upSlide():
    index = index + 1
    main()

def downSlide():
    if index > 0:
      index = index - 1
    main()


# To use this in main.py screen import into main.py or copy below code in main.py
# from screens.teleprompter_main_screen import teleprompter_main
teleprompter_main()