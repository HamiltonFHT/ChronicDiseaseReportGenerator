''' Depression Search Reformatter
    Copyright (C) 2014  Tom Sitter; Hamilton Family Health Team

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.'''


from tkinter.filedialog import askopenfilename, asksaveasfilename, Tk
import csv

#Prevent tk window from displaying
root = Tk()
root.withdraw()

appointments = {}
currentPatient = ''
#Select whether to output patient # (anonymous = True) or patient name (anonymous = False)
anonymous = True

#Get user to select a file
filename = askopenfilename(title='Select a PSS patient appointment report to analyze')
temp = filename.rsplit(".", 1) #split off "txt" extension
temp.insert(1, "reformat") #insert "reformat" before extension
output = ".".join(temp) #join back together into one string

with open(filename, 'r') as f:
    reformatted = []
    num_cols = 0
    prev_line = ""
    flag = 0
    #Read file row by row
    for line in f:
        if (line.startswith("Patient #")):
            num_cols = len(line.split(","))
        if (len(line) == 1):
            continue
        elif (line == ",\n"):
            prev_line+=line
            reformatted.append(prev_line)
        elif (line.strip()[-1] != ","):
            #This line will need to be built up
            if (line.find(",") == -1):
                prev_line = ";".join([prev_line, line.strip()])
            else:
                prev_line = line.strip()
        elif (len(line.split(",")) == num_cols):
            reformatted.append(line)
        else:
            prev_line = line.strip();

with open(output, 'w') as o:
    for line in reformatted:
        o.write(line)